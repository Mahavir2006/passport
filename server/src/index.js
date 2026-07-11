import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { agentsRouter } from "./routes/agents.js";
import { initWebsocketServer } from "./websocket.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/agents", agentsRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Wrap Express in a raw http.Server so Socket.io can share the same port
const httpServer = http.createServer(app);
initWebsocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`AgentPassport server listening on http://localhost:${PORT}`);
});
