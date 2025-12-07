import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";

export default function DirectMessage() {
    const router = useRouter();
    const { email, name } = router.query;

    const socketRef = useRef(null);      // ensures a single socket
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    useEffect(() => {
        if (!router.isReady) return;

        const me = localStorage.getItem("userEmail")?.toLowerCase().trim();
        const other = email?.toLowerCase().trim();

        setCurrentUserEmail(me);


        // Create socket ONLY once
        if (!socketRef.current) {
            socketRef.current = io("https://socket-server-cyma.onrender.com");
        }

        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("Connected:", socket.id);

            if (me && other) {
                const room = [me, other].sort().join("_");
                console.log("Joining room:", room);
                socket.emit("join-room", room);

                fetch(`/api/getDM?roomId=${room}`)
                    .then(res => res.json())
                    .then(data => {
                        setMessages(data.messages || []);



                    });
            }
        });

        // Receive message — but IGNORE your own
        const handleReceive = (msg) => {
            if (msg.sender === me) return;
            console.log("Received:", msg);
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("receive-message", handleReceive);

        return () => {
            socket.off("receive-message", handleReceive);
        };
    }, [router.isReady, email]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const me = currentUserEmail.toLowerCase().trim();
        const other = email.toLowerCase().trim();
        const room = [me, other].sort().join("_");

        const msg = {
            roomId: room,
            sender: me,
            message: input,
            timestamp: Date.now()
        };

        // show YOUR message once
        setMessages((prev) => [...prev, msg]);

        // send to receiver
        socketRef.current.emit("send-message", msg);

        // Save to db
        await fetch("/api/saveDM", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg)
        });

        setInput("");
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Chat with {name || email}</h1>

            <div className="border rounded-md p-4 h-96 overflow-y-auto bg-white">
                {messages.map((msg, index) => (
                    <p
                        key={index}
                        className={`mb-2 ${msg.sender === currentUserEmail
                            ? "text-purple-600 text-right"
                            : "text-gray-700"
                            }`}
                    >
                        <strong>
                            {msg.sender === currentUserEmail ? "You" : name}:
                        </strong>{" "}
                        {msg.message}
                    </p>
                ))}
            </div>

            <div className="mt-4 flex gap-2">
                <input
                    className="flex-1 p-2 border rounded-md"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button
                    onClick={sendMessage}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
