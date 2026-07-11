// websocket.js — Socket.io wrapper for real-time agent task updates
import { Server } from "socket.io";

let io;

/**
 * Attach Socket.io to the raw http.Server created in index.js.
 * Must be called once before any emitToDispatchSession calls.
 * @param {import("http").Server} httpServer
 */
export function initWebsocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    // Client sends its dispatchSessionId so we can address it specifically
    socket.on("join", (sessionId) => {
      socket.join(sessionId);
    });
  });

  return io;
}

/**
 * Emit an event to all sockets in a specific dispatch session room.
 * @param {string} sessionId
 * @param {string} event  — "visa_status" | "task_status"
 * @param {object} payload
 */
export function emitToDispatchSession(sessionId, event, payload) {
  if (!io) {
    console.warn("WebSocket server not initialized — skipping emit:", event, payload);
    return;
  }
  io.to(sessionId).emit(event, payload);
}
