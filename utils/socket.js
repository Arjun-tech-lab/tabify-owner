// utils/socket.js (shared or in owner frontend)
import { io } from "socket.io-client";
export const socket = io("http://localhost:5001", {
  transports: ["websocket"],
});
