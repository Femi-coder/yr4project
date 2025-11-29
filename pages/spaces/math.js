import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import io from "socket.io-client";

export default function MathSpace() {
  const [mathSpace, setMathSpace] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  //Space Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const socketRef = useRef(null);


  useEffect(() => {
    setCurrentUserEmail(localStorage.getItem("userEmail"));
    setCurrentUserName(localStorage.getItem("userName"));
  }, []);

  useEffect(() => {
    fetch("/api/getMathSpace")
      .then((res) => res.json())
      .then((data) => setMathSpace(data.space));
  }, []);

  useEffect(() => {
    if (!mathSpace) return;

    fetch(`/api/getSpaceMessages?spaceId=${mathSpace._id}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages);
      });
  }, [mathSpace]);

  // Real time space chat socket connection
  useEffect(() => {
    if (!mathSpace || !currentUserEmail) return;

    fetch("/api/socket"); // Start backend socket server

    if (!socketRef.current) {
      socketRef.current = io({ path: "/api/socket" });
    }

    const socket = socketRef.current;
    const spaceId = mathSpace._id; // room ID

    socket.emit("join-space", spaceId);

    socket.off("space-message");

    socket.on("space-message", (data) => {
      if (data.sender === currentUserEmail) return;
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("space-message");
    };
  }, [mathSpace, currentUserEmail]);

  // Send chat message
  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const msg = {
      spaceId: mathSpace._id,
      sender: currentUserEmail,
      name: currentUserName,
      message: chatInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);

    socketRef.current.emit("space-message", msg);

    setChatInput("");
  };


  if (!mathSpace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading space...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Left Sidebar — Members */}
      <aside className="w-72 bg-white border-r shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Members</h2>

        {mathSpace.members.map((m, i) => {
          const isYou = m.email === currentUserEmail;
          return (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition mb-2"
            >
              <div className="flex items-center gap-3">

                {/* Avatar Circle */}
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  {m.name?.charAt(0).toUpperCase()}
                </div>



                <div>
                  <p className="font-medium">{isYou ? "You" : m.name}</p>
                  <p className="text-gray-500 text-sm">{m.email}</p>
                </div>
              </div>
              {!isYou && (
                <Link
                  href={`/dm/${encodeURIComponent(m.email)}?name=${encodeURIComponent(m.name)}`}
                  className="ml-4 text-purple-600 font-semibold text-sm hover:underline whitespace-nowrap"
                >
                  DM
                </Link>
              )}
            </div>
          );
        })}
      </aside>

      {/* Main Content — Space Dashboard */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2 mb-3">
          {mathSpace.icon || "📘"} {mathSpace.title}
        </h1>

        <p className="text-gray-700 mb-6">{mathSpace.desc}</p>

        {/* Announcements */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-2">Announcements</h3>
          <p className="text-gray-600">No announcements yet.</p>
        </div>

        {/* REAL-TIME SPACE CHAT */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Discussion</h3>

          <div className="border rounded-lg h-64 p-4 overflow-y-auto bg-white" id="discussion-box">
            {messages.map((msg, i) => (
              <p
                key={i}
                className={`mb-2 ${msg.sender === currentUserEmail
                  ? "text-purple-600 text-right"
                  : "text-gray-800"
                  }`}
              >
                <strong>{msg.sender === currentUserEmail ? "You" : msg.name}:</strong>{" "}
                {msg.message}
              </p>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 p-2 border rounded-md"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 text-white px-4 py-2 rounded-md"
            >
              Send
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

