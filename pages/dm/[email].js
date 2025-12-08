import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";

export default function DirectMessage() {
    const router = useRouter();
    const { email, name } = router.query;

    const socketRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    // Establish socket connection once
    useEffect(() => {
        const SOCKET_URL =
            process.env.NODE_ENV === "development"
                ? "http://localhost:4000"
                : "https://socket-server-cyma.onrender.com";

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
        }
    }, []);

    // Handle room join and initial message fetch
    useEffect(() => {
        if (!router.isReady) return;

        const me = localStorage.getItem("userEmail")?.toLowerCase().trim();
        const other = email?.toLowerCase().trim();
        if (!me || !other) return;

        setCurrentUserEmail(me);

        const room = [me, other].sort().join("_");
        const socket = socketRef.current;

        // Always join room immediately—fixes real-time issue
        socket.emit("join-room", room);

        // Load message history
        fetch(`/api/getDM?roomId=${room}`)
            .then(res => res.json())
            .then(data => setMessages(data.messages || []));

        // Listener for real-time messages
        const handleReceive = (msg) => {
            if (msg.sender === me) return; // ignore your own
            setMessages(prev => [...prev, msg]);
        };

        socket.on("receive-message", handleReceive);

        return () => {
            socket.off("receive-message", handleReceive);
        };
    }, [router.isReady, email]);

    // Send Message
    const sendMessage = async () => {
        if (!input.trim()) return;

        const me = currentUserEmail.toLowerCase().trim();
        const other = email.toLowerCase().trim();
        const room = [me, other].sort().join("_");

        const msg = {
            roomId: room,
            sender: me,
            message: input,
            timestamp: Date.now(),
        };

        // Show message instantly
        setMessages(prev => [...prev, msg]);

        // Send through socket
        socketRef.current.emit("send-message", msg);

        // Save to DB
        await fetch("/api/saveDM", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
        });

        setInput("");
    };

    // UI
    return (
        <div className="h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col h-[85vh]">

                <header className="p-4 bg-purple-600 text-white font-semibold text-lg rounded-t-xl shadow">
                    Chat with {name || email}
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, index) => {
                        const isMe = msg.sender === currentUserEmail;

                        return (
                            <div
                                key={index}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-xs px-4 py-2 rounded-xl shadow-sm ${isMe
                                            ? "bg-purple-600 text-white rounded-br-none"
                                            : "bg-white text-gray-800 border rounded-bl-none"
                                        }`}
                                >
                                    <p className="text-xs font-semibold mb-1 opacity-80">
                                        {isMe ? "You" : name}
                                    </p>
                                    <p>{msg.message}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 bg-white flex gap-3 border-t rounded-b-xl">
                    <input
                        className="flex-1 p-3 border rounded-xl shadow-sm outline-purple-600"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl shadow"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
