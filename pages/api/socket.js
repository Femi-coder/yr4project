import { Server } from "socket.io";

export const config = {
    api: {
        bodyParser: false
    }
};

export default function handler(req, res) {
    if (!res.socket.server.io) {

        console.log("Initializing Socket.IO server...");

        const io = new Server(res.socket.server, {
            path: "/api/socket",
            addTrailingSlash: false,
        });

        io.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            socket.on("join-room", (room) => {
                console.log("Joining room:", room);
                socket.join(room);
            });

            socket.on("send-message", ({ room, sender, message }) => {
                console.log("Broadcasting:", room, sender, message);
                socket.to(room).emit("receive-message", { sender, message });
            });
        });

        res.socket.server.io = io;
    }

    res.status(200).json({ message: "Socket.IO server running" });
}
