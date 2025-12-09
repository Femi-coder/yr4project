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

    // setup socket and load chat
    useEffect(() => {
        if (!router.isReady) return;

        const me = localStorage.getItem("userEmail")?.trim().toLowerCase();
        const other = email?.trim().toLowerCase();
        if (!me || !other) return;

        setCurrentUserEmail(me);

        const SOCKET_URL =
            process.env.NODE_ENV === "development"
                ? "http://localhost:4000"
                : "https://socket-server-cyma.onrender.com";

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                transports: ["websocket"],
            });
        }

        const socket = socketRef.current;
        const room = [me, other].sort().join("_");

        socket.emit("join-room", room);

        // load previous messages
        fetch(`/api/getDM?roomId=${room}`)
            .then(res => res.json())
            .then(data => setMessages(data.messages || []));

        // listen for new messages
        socket.on("receive-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // polling fallback
        const interval = setInterval(() => {
            fetch(`/api/getDM?roomId=${room}`)
                .then(res => res.json())
                .then(data => setMessages(data.messages || []));
        }, 3000);

        return () => {
            socket.off("receive-message");
            clearInterval(interval);
        };

    }, [router.isReady, email]);


    // send message
    const sendMessage = async () => {
        if (!input.trim()) return;

        const me = currentUserEmail;
        const other = email.trim().toLowerCase();
        const room = [me, other].sort().join("_");

        const msg = {
            roomId: room,
            sender: me,
            message: input,
            timestamp: Date.now(),
        };

        // show instantly
        setMessages((prev) => [...prev, msg]);

        // send to socket server
        socketRef.current.emit("send-message", msg);

        // save to db
        await fetch("/api/saveDM", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
        });

        setInput("");
    };

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
                            <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
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
                        onChange={(e) => setInput(e.target.value)}
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
