import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import io from "socket.io-client";

export default function DynamicSpace() {
    const router = useRouter();
    const { id } = router.query;

    const socketRef = useRef(null);

    const [space, setSpace] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const [currentUserName, setCurrentUserName] = useState("");
    const [onlineUsers, setOnlineUsers] = useState({});

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");

    const [announcements, setAnnouncements] = useState([]);
    const [annInput, setAnnInput] = useState("");

    // Format time
    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Load current user
    useEffect(() => {
        setCurrentUserEmail(localStorage.getItem("userEmail"));
        setCurrentUserName(localStorage.getItem("userName"));
    }, []);

    useEffect(() => {
        if (!router.isReady || !id) return;

        fetch(`/api/getSpace?spaceId=${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.space) {
                    setSpace(data.space);
                } else {
                    console.error("Space not found:", data);
                }
            })
            .catch((err) => console.error("Fetch error:", err));
    }, [router.isReady, id]);



    // Load discussion messages
    useEffect(() => {
        if (!id) return;

        fetch(`/api/getSpaceMessages?spaceId=${id}`)
            .then((res) => res.json())
            .then((data) => setMessages(data.messages || []));
    }, [id]);

    // Load announcements
    useEffect(() => {
        if (!id) return;

        fetch(`/api/getAnnouncements?spaceId=${id}`)
            .then((res) => res.json())
            .then((data) => setAnnouncements(data.announcements || []));
    }, [id]);

    // SOCKET.IO CONNECTION
    useEffect(() => {
        if (!space || !currentUserEmail) return;

        if (!socketRef.current) {
            const SOCKET_URL =
                process.env.NODE_ENV === "development"
                    ? "http://localhost:4000"
                    : "https://socket-server-cyma.onrender.com";

            socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
        }

        const socket = socketRef.current;

        // Join room for this space
        socket.emit("join-space", id);

        // Mark user online
        socket.emit("user-online", currentUserEmail);

        // Track online users
        socket.on("online-users", (data) => {
            setOnlineUsers(data);
        });

        // Receive discussion message
        const handleMsg = (data) => {
            if (data.sender === currentUserEmail) return;
            setMessages((prev) => [...prev, data]);
        };

        socket.on("space-message", handleMsg);

        // Receive announcement
        const handleAnnouncement = (data) => {
            setAnnouncements((prev) => [...prev, data]);
        };

        socket.on("announcement", handleAnnouncement);

        return () => {
            socket.off("space-message", handleMsg);
            socket.off("announcement", handleAnnouncement);
            socket.off("online-users");
        };
    }, [space, currentUserEmail]);

    // SEND DISCUSSION MESSAGE
    const sendMessage = async () => {
        if (!chatInput.trim()) return;

        const msg = {
            spaceId: id,
            sender: currentUserEmail,
            name: currentUserName,
            type: "text",
            content: chatInput,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, msg]);
        socketRef.current.emit("space-message", msg);

        setChatInput("");
    };

    // Handling File Uploads
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("spaceId", id);
        formData.append("sender", currentUserEmail);
        formData.append("name", currentUserName);

        const res = await fetch("/api/uploadFile", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (data.success) {
            setMessages((prev) => [...prev, data.message]);
        } else {
            alert(data.error || "Upload failed");
        }
    };


    // SEND ANNOUNCEMENT
    const sendAnnouncement = async () => {
        if (!annInput.trim()) return;

        const announcement = {
            spaceId: id,
            sender: currentUserEmail,
            text: annInput,
            timestamp: Date.now(),
        };

        setAnnouncements((prev) => [...prev, announcement]);
        socketRef.current.emit("announcement", announcement);

        setAnnInput("");
    };

    // Exit space
    const leave = () => router.push("/dashboard");

    if (!space) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600">Loading space...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">

            {/* LEFT SIDEBAR — MEMBERS */}
            <aside className="w-full lg:w-64 bg-white lg:border-r shadow-sm p-5 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Members
                </h2>

                {space.members.map((m, i) => {
                    const isYou = m.email === currentUserEmail;

                    return (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 mb-2"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>

                                    <span
                                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${onlineUsers[m.email] ? "bg-green-500" : "bg-red-500"
                                            }`}
                                    ></span>
                                </div>

                                <div>
                                    <p className="font-medium text-sm">{isYou ? "You" : m.name}</p>
                                    <p className="text-xs text-gray-500">{m.email}</p>
                                </div>
                            </div>

                            {!isYou && (
                                <Link
                                    href={`/dm/${encodeURIComponent(m.email)}?name=${encodeURIComponent(m.name)}`}
                                    className="text-purple-600 text-xs font-semibold hover:underline"
                                >
                                    DM
                                </Link>
                            )}
                        </div>
                    );
                })}
            </aside>

            {/* MAIN CONTENT — DISCUSSION */}
            <main className="flex-1 flex flex-col p-4 md:p-8 gap-6 overflow-y-auto">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-3">
                        <span className="text-3xl">{space.icon}</span>
                        {space.title}
                    </h1>

                    <p className="text-gray-600">{space.desc}</p>
                    <p className="text-sm text-purple-700 flex justify-between mt-2">
                        👥 {space.members.length} Members
                        <button
                            onClick={leave}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                        >
                            Exit Space
                        </button>
                    </p>
                </div>

                {/* DISCUSSION BOX */}
                <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col h-[70vh] md:h-[75vh]">
                    <h3 className="text-lg font-semibold mb-3">Discussion</h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {messages.map((msg, i) => {
                            const isMe = msg.sender === currentUserEmail;

                            return (
                                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`w-fit max-w-[85%] px-4 py-2 rounded-lg shadow-sm ${isMe
                                            ? "bg-purple-600 text-white rounded-br-none"
                                            : "bg-gray-200 text-gray-800 rounded-bl-none"
                                            }`}
                                    >
                                        <p className="text-xs font-semibold mb-1">
                                            {isMe ? "You" : msg.name}
                                        </p>
                                        {msg.type === "file" ? (
                                            <div className="bg-white text-gray-800 rounded-xl p-4 shadow-md w-full max-w-sm">

                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                                                        📄
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold truncate">
                                                            {msg.originalName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Shared by {msg.name}
                                                        </p>
                                                    </div>
                                                </div>

                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-center bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition"
                                                >
                                                    Download
                                                </a>

                                            </div>
                                        ) : (

                                            <p>{msg.content || msg.message}</p>
                                        )}
                                        <p className="text-[10px] opacity-70 mt-1 text-right">
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DISCUSSION INPUT */}
                    <div className="mt-4 flex gap-3">

                        <input
                            type="file"
                            id="fileUpload"
                            hidden
                            onChange={handleFileUpload}
                        />

                        <button
                            onClick={() => document.getElementById("fileUpload").click()}
                            className="bg-purple-300 px-4 py-2 rounded-lg"
                        >
                            📎
                        </button>

                        <input
                            className="flex-1 p-3 border rounded-lg"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </main>

            {/* RIGHT SIDEBAR — ANNOUNCEMENTS */}
            <aside className="w-full lg:w-80 bg-white lg:border-l shadow-sm p-5 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Announcements
                </h2>

                <div className="flex gap-2 mb-4">
                    <input
                        className="flex-1 p-2 border rounded-lg"
                        placeholder="Post announcement..."
                        value={annInput}
                        onChange={(e) => setAnnInput(e.target.value)}
                    />
                    <button
                        onClick={sendAnnouncement}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                    >
                        Post
                    </button>
                </div>

                <div className="space-y-3">
                    {announcements.map((a, i) => (
                        <div
                            key={i}
                            className="relative bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded shadow-sm"
                        >
                            <span className="absolute -left-2 -top-2 text-xl">📍</span>
                            <p className="text-sm font-medium text-gray-800">{a.text}</p>
                            <p className="text-xs mt-1 text-gray-500">
                                {formatTime(a.timestamp)}
                            </p>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
}
