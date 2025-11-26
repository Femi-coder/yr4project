import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("join-room", (room) => {
        socket.join(room);
      });

      socket.on("send-message", ({ room, sender, message }) => {
        io.to(room).emit("receive-message", { sender, message });
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
