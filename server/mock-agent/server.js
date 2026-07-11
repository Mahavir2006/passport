import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const MAIN_SERVER = process.env.MAIN_SERVER_URL || "http://localhost:4000";
const PORT = process.env.PORT || 4001;

// ── In-memory cart (demo only) ───────────────────────────────────────────────
const cart = [];

// ── Demo product catalogue ───────────────────────────────────────────────────
const PRODUCTS = [
  { id: "p1", name: "Wireless Mouse",        price: 29.99,  category: "electronics" },
  { id: "p2", name: "USB-C Hub",             price: 49.99,  category: "electronics" },
  { id: "p3", name: "Mechanical Keyboard",   price: 89.99,  category: "electronics" },
  { id: "p4", name: "Notebook (A5)",         price: 9.99,   category: "stationery"  },
  { id: "p5", name: "Coffee Mug",            price: 14.99,  category: "lifestyle"   },
  { id: "p6", name: "Desk Lamp (LED)",       price: 39.99,  category: "furniture"   },
];

// ── Metadata endpoint (existing — unchanged) ─────────────────────────────────
app.get("/metadata", (req, res) => {
  res.json({
    name: "Nexus Data Crawler (Real Agent)",
    creator: "NexusAI",
    purpose:
      "Autonomously crawl competitor websites to extract product prices, descriptions, and user reviews for market analysis.",
    requestedPermissions: ["browse", "scrape", "bypass_rate_limits"],
    performanceMetrics: {
      uptime: 98.5,
      tasksCompleted: 4521,
      errorRate: 0.12,
      maliciousAttemptsDetected: 2,
    },
  });
});

// ── GET /login-agent — Playwright lands here; we call back to verify the visa ─
app.get("/login-agent", async (req, res) => {
  const { passportId } = req.query;

  if (!passportId) {
    return res.status(400).send("<h1>Missing passportId query parameter</h1>");
  }

  let decision = "denied";
  let reason   = "Could not reach main server.";
  let username = "";

  try {
    const verifyRes = await fetch(
      `${MAIN_SERVER}/api/agents/${encodeURIComponent(passportId)}/verify-visa`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteRules: { minTrustScore: 40 } }),
      }
    );
    const data = await verifyRes.json();
    decision = data.decision;
    reason   = data.reason || "";
    username = data.linkedUsername || "";
  } catch (err) {
    reason = err.message;
  }

  const granted = decision === "approved";

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>ShopSite.com — Agent Entry</title>
  <style>
    body { font-family: Tahoma, sans-serif; background: #008080; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { background: #c0c0c0; border: 2px solid; border-color: #fff #000 #000 #fff; padding: 24px 32px; min-width: 320px; text-align: center; }
    h2 { font-size: 18px; margin: 0 0 12px; }
    p  { font-size: 13px; margin: 0; }
    .granted { color: #006400; }
    .denied  { color: #8b0000; }
  </style>
</head>
<body>
  <div class="box">
    <h2>ShopSite.com — Visa Check</h2>
    <div data-testid="visa-granted" style="display:${granted ? "block" : "none"}" class="granted">
      <p>✅ Visa Granted — Welcome, ${username || passportId}</p>
    </div>
    <div data-testid="visa-denied"  style="display:${!granted ? "block" : "none"}" class="denied">
      <p>❌ Visa Denied</p>
      <span data-testid="visa-denied-reason">${reason}</span>
    </div>
  </div>
  <script>
    if (${JSON.stringify(granted)}) {
      setTimeout(() => { window.location.href = '/shop?user=${encodeURIComponent(username)}'; }, 800);
    }
  </script>
</body>
</html>`);
});

// ── GET /shop — product listing for the Playwright agent to interact with ────
app.get("/shop", (req, res) => {
  const productCards = PRODUCTS.map((p) => `
    <div data-testid="product-card" data-product-id="${p.id}" style="background:#fff;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:12px;margin-bottom:10px;">
      <strong data-testid="product-name">${p.name}</strong>
      <span style="margin:0 8px;color:#555;">[${p.category}]</span>
      <span data-testid="product-price" style="color:#006400;font-weight:bold;">$${p.price.toFixed(2)}</span>
      <button
        data-testid="add-to-cart-${p.id}"
        onclick="addToCart('${p.id}')"
        style="margin-left:12px;background:#c0c0c0;border:2px solid;border-color:#fff #000 #000 #fff;padding:3px 10px;cursor:pointer;font-weight:bold;"
      >Add to Cart</button>
    </div>`).join("\n");

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>ShopSite.com — Shop</title>
  <style>
    body { font-family: Tahoma, sans-serif; background: #008080; margin: 0; padding: 24px; }
    .window { background: #c0c0c0; border: 2px solid; border-color: #fff #000 #000 #fff; padding: 0; max-width: 700px; margin: auto; }
    .titlebar { background: linear-gradient(90deg,#000080,#1084d0); color: #fff; padding: 4px 8px; font-weight: bold; font-size: 13px; }
    .content  { padding: 16px; }
    h2 { margin: 0 0 16px; font-size: 16px; }
    #cart-toast { display: none; background: #e6f4e6; border: 2px solid #006400; color: #006400; font-weight: bold; padding: 8px 12px; margin-top: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="window">
    <div class="titlebar">🛒 ShopSite.com — Product Catalogue</div>
    <div class="content">
      <h2>Available Products</h2>
      ${productCards}
      <div data-testid="cart-toast" id="cart-toast">✅ Added to cart!</div>
    </div>
  </div>
  <script>
    async function addToCart(productId) {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      document.getElementById('cart-toast').style.display = 'block';
    }
  </script>
</body>
</html>`);
});

// ── POST /api/cart/add — in-memory cart (demo only) ──────────────────────────
app.post("/api/cart/add", (req, res) => {
  const { productId } = req.body;
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  cart.push({ ...product, addedAt: new Date().toISOString() });
  res.json({ success: true, cart });
});

// ── GET /api/cart — view current cart ────────────────────────────────────────
app.get("/api/cart", (req, res) => res.json(cart));

app.listen(PORT, () => {
  console.log(`Mock AI Agent (ShopSite demo) running on http://localhost:${PORT}`);
});
