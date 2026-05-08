// utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:5001";

// Create a singleton socket instance
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true, // ensures it connects immediately when imported
});
