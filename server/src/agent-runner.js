// agent-runner.js — Playwright automation that drives a target site
// on behalf of a registered agent passport.
import { chromium } from "playwright";
import { emitToDispatchSession } from "./websocket.js";
import { getCredentials } from "./credentialsStore.js";

/**
 * Run an agent task against a target site.
 *
 * Flow:
 *   1. Navigate to targetUrl/login-agent  →  passport visa check (AgentPassport protocol)
 *      OR if the site has a standard login page, do credential-based login instead.
 *   2. Once inside, browse the shop, pick the best product, add to cart.
 *
 * @param {{ passportId: string, targetUrl: string, purpose: string,
 *            grantedPermissions: string[], dispatchSessionId: string,
 *            loginPagePath?: string,        // e.g. "/login" — if set, does credential login
 *            usernameSelector?: string,     // CSS selector for username field
 *            passwordSelector?: string,     // CSS selector for password field
 *            submitSelector?: string,       // CSS selector for login button
 *            postLoginSelector?: string,    // selector to wait for after login (confirms success)
 *         }} opts
 */
export async function runAgentTask({
  passportId,
  targetUrl,
  purpose,
  grantedPermissions,
  dispatchSessionId,
  // Optional — if provided, agent does a real credential login instead of /login-agent
  loginPagePath     = null,
  usernameSelector  = 'input[name="email"], input[name="username"], input[type="email"]',
  passwordSelector  = 'input[name="password"], input[type="password"]',
  submitSelector    = 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
  postLoginSelector = null,   // e.g. '[data-testid="dashboard"]' or '**/dashboard**' (URL pattern)
}) {
  function emit(event, payload) {
    emitToDispatchSession(dispatchSessionId, event, payload);
  }

  emit("visa_status", { status: "pending" });

  // Use headless: false so judges can watch the agent work live.
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();

  try {
    // ── PATH A: credential-based login (real site with a login form) ──────────
    if (loginPagePath) {
      const creds = getCredentials(passportId);
      if (!creds) {
        emit("visa_status", { status: "denied", reason: "No credentials linked to this passport." });
        await browser.close();
        return { success: false, reason: "No credentials linked to this passport." };
      }

      emit("visa_status", { status: "pending" });

      // 1. Go to login page
      await page.goto(`${targetUrl}${loginPagePath}`);

      // 2. Fill username
      await page.fill(usernameSelector, creds.username);

      // 3. Fill password
      await page.fill(passwordSelector, creds.password);

      // 4. Click login button
      await page.click(submitSelector);

      // 5. Wait for post-login confirmation
      if (postLoginSelector) {
        if (postLoginSelector.startsWith("**")) {
          // It's a URL glob pattern
          await page.waitForURL(postLoginSelector, { timeout: 15000 });
        } else {
          // It's a CSS selector
          await page.waitForSelector(postLoginSelector, { timeout: 15000 });
        }
      } else {
        // Generic fallback: wait for navigation to settle
        await page.waitForLoadState("networkidle", { timeout: 15000 });
      }

      emit("visa_status", { status: "approved" });

    // ── PATH B: AgentPassport /login-agent protocol (our mock site) ───────────
    } else {
      const loginUrl = `${targetUrl}/login-agent?passportId=${encodeURIComponent(passportId)}`;
      await page.goto(loginUrl);

      const outcome = await Promise.race([
        page
          .waitForSelector('[data-testid="visa-granted"]', { timeout: 15000 })
          .then(() => "granted"),
        page
          .waitForSelector('[data-testid="visa-denied"]', { timeout: 15000 })
          .then(() => "denied"),
      ]);

      if (outcome === "denied") {
        const reasonEl = await page.$('[data-testid="visa-denied-reason"]');
        const reasonText = reasonEl ? await reasonEl.textContent() : "Visa denied by site.";
        emit("visa_status", { status: "denied", reason: reasonText });
        await browser.close();
        return { success: false, reason: reasonText };
      }

      emit("visa_status", { status: "approved" });

      // Wait for redirect to /shop
      await page.waitForURL("**/shop", { timeout: 10000 });
    }

    // ── Shared: browse shop, pick product, add to cart ────────────────────────
    emit("task_status", { status: "in_progress" });

    const products = await page.$$eval(
      '[data-testid="product-card"]',
      (cards) =>
        cards.map((card) => ({
          id: card.getAttribute("data-product-id"),
          name: card.querySelector('[data-testid="product-name"]').textContent.trim(),
          price: parseFloat(
            card.querySelector('[data-testid="product-price"]').textContent.replace("$", "")
          ),
        }))
    );

    const chosen = await chooseProduct(products, purpose, grantedPermissions);

    await page.click(`[data-testid="add-to-cart-${chosen.id}"]`);
    await page.waitForSelector('[data-testid="cart-toast"]', { timeout: 5000 });

    emit("task_status", { status: "success", item: chosen.name, price: chosen.price });
    await browser.close();
    return { success: true, item: chosen.name, price: chosen.price };

  } catch (err) {
    emit("task_status", { status: "failed", error: err.message });
    await browser.close();
    return { success: false, error: err.message };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSpendingLimit(permissions) {
  const rule = (permissions || []).find((p) => p.startsWith("checkout<="));
  return rule ? parseFloat(rule.split("<=")[1]) : Infinity;
}

async function chooseProduct(products, purpose, permissions) {
  const limit = getSpendingLimit(permissions);
  const affordable = products.filter((p) => p.price <= limit);
  const pool = affordable.length > 0 ? affordable : products;

  try {
    const llmChoice = await askLLMToChoose(pool, purpose);
    if (llmChoice) return llmChoice;
  } catch (_) {
    // LLM unavailable — fall back to cheapest
  }

  return pool.sort((a, b) => a.price - b.price)[0];
}

async function askLLMToChoose(products, purpose) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Pick ONE product id that best matches the agent purpose. Respond ONLY with the id, nothing else.",
        },
        {
          role: "user",
          content: `Purpose: "${purpose}"\nProducts: ${JSON.stringify(products)}`,
        },
      ],
      max_tokens: 20,
    }),
  });

  const data = await res.json();
  const id = data.choices?.[0]?.message?.content?.trim();
  return products.find((p) => p.id === id) || null;
}
