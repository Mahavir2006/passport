import express from "express";
import cors from "cors";
import { agentsRouter } from "./routes/agents.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/agents", agentsRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`AgentPassport server listening on http://localhost:${PORT}`);
});
