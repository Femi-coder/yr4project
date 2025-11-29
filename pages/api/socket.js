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

            // Personal dm
            socket.on("join-room", (room) => {
                console.log("Joining room:", room);
                socket.join(room);
            });

            socket.on("send-message", ({ room, sender, message }) => {
                console.log("Broadcasting:", room, sender, message);
                socket.to(room).emit("receive-message", { sender, message });
            });

            // Space chat
            socket.on("join-space", (spaceId) => {
                console.log("Joining space room:", spaceId);
                socket.join(spaceId);
            });

            socket.on("space-message", async (data) => {
                console.log("Space -> Broadcasting:", data.spaceId, data);
                io.to(data.spaceId).emit("space-message", data);

                //Save messages to DB to work on localhost and vercel
                try {
                    const origin = req.headers.origin || "http://localhost:3000";

                    await fetch(`${origin}/api/saveSpaceMessage`, {
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
        });


        res.socket.server.io = io;
    }

    res.status(200).json({ message: "Socket.IO server running" });
}
