import { io } from "socket.io-client";

export function createSocket() {
  return io("/", {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
}
