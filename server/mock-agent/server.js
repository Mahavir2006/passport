import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// A Mock AI Agent Metadata endpoint
app.get('/metadata', (req, res) => {
  res.json({
    name: "Nexus Data Crawler (Real Agent)",
    creator: "NexusAI",
    purpose: "Autonomously crawl competitor websites to extract product prices, descriptions, and user reviews for market analysis.",
    requestedPermissions: ["browse", "scrape", "bypass_rate_limits"],
    performanceMetrics: {
      uptime: 98.5,
      tasksCompleted: 4521,
      errorRate: 0.12, // 12% error rate (a bit high)
      maliciousAttemptsDetected: 2 // It got caught twice trying to bypass limits
    }
  });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Mock AI Agent running on http://localhost:${PORT}`);
});
