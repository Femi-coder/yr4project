import { Server } from "socket.io";

export const config = {
    api: {
        bodyParser: false
    }
};

// Global Online Users
let onlineUsers = {};

export default function handler(req, res) {
    if (!res.socket.server.io) {

        console.log("Initializing Socket.IO server...");

        const io = new Server(res.socket.server, {
            path: "/api/socket",
            addTrailingSlash: false,
        });

        io.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            // Personal dm 
            socket.on("join-room", (room) => {
                socket.join(room);
            });

            socket.on("send-message", ({ room, sender, message }) => {
                socket.to(room).emit("receive-message", { sender, message });
            });

            // Online Status
            socket.on("user-online", (email) => {
                onlineUsers[email] = socket.id; // mark user as online
                io.emit("online-users", onlineUsers); // update all clients
            });

            // Space chat 
            socket.on("join-space", (spaceId) => {
                socket.join(spaceId);
            });

            socket.on("space-message", async (data) => {
                io.to(data.spaceId).emit("space-message", data);

                // Save messages to DB
                try {
                    await fetch("http://localhost:3000/api/saveSpaceMessage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...data,
                            timestamp: Date.now(),
                        }),
                    });
                } catch (err) {
                    console.error("Failed to save message:", err);
                }
            });

            // Handle disconnect
            socket.on("disconnect", () => {
                for (const email in onlineUsers) {
                    if (onlineUsers[email] === socket.id) {
                        delete onlineUsers[email]; // remove offline user
                        break;
                    }
                }

                io.emit("online-users", onlineUsers); // this updates all clients
            });
        });

        res.socket.server.io = io;
    }

    res.status(200).json({ message: "Socket.IO server running" });
}
