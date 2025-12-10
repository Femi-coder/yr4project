import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import io from "socket.io-client";

export default function MathSpace() {
  const [mathSpace, setMathSpace] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState({});
  const [annInput, setAnnInput] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [annLevel, setAnnLevel] = useState("normal");

  const socketRef = useRef(null);

  useEffect(() => {
    setCurrentUserEmail(localStorage.getItem("userEmail"));
    setCurrentUserName(localStorage.getItem("userName"));
  }, []);

  useEffect(() => {
    fetch("/api/getMathSpace")
      .then(res => res.json())
      .then(data => setMathSpace(data.space));
  }, []);

  useEffect(() => {
    if (!mathSpace) return;

    fetch(`/api/getSpaceMessages?spaceId=${mathSpace._id}`)
      .then(res => res.json())
      .then(data => setMessages(data.messages));

    fetch(`/api/getAnnouncements?spaceId=${mathSpace._id}`)
      .then(res => res.json())
      .then(data => setAnnouncements(data.announcements || []));
  }, [mathSpace]);

  useEffect(() => {
    if (!mathSpace || !currentUserEmail) return;

    if (!socketRef.current) {
      socketRef.current = io("https://socket-server-cyma.onrender.com", {
        transports: ["websocket"],
      });
    }

    const socket = socketRef.current;
    const spaceId = mathSpace._id;

    socket.emit("user-online", currentUserEmail);

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.emit("join-space", spaceId);

    socket.off("space-message");
    socket.on("space-message", (data) => {
      if (data.sender === currentUserEmail) return;
      setMessages(prev => [...prev, data]);
    });

    socket.off("announcement");
    socket.on("announcement", (data) => {
      setAnnouncements(prev => [...prev, data]);
    });

    return () => {
      socket.off("space-message");
      socket.off("announcement");
    };
  }, [mathSpace, currentUserEmail]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const msg = {
      spaceId: mathSpace._id,
      sender: currentUserEmail,
      name: currentUserName,
      message: chatInput,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, msg]);
    socketRef.current.emit("space-message", msg);

    setChatInput("");
  };


  const sendAnnouncement = () => {
    if (!annInput.trim()) return;

    const announcement = {
      spaceId: mathSpace._id,
      sender: currentUserEmail,
      senderName: currentUserName,
      text: annInput,
      level: annLevel,
      timestamp: Date.now(),
    };

    socketRef.current.emit("announcement", announcement);

    setAnnInput("");
  };


  if (!mathSpace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading space...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-indigo-100">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r shadow-sm p-5 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Members</h2>

        {(() => {
          const sortedMembers = [...mathSpace.members].sort((a, b) => {
            if (a.email === currentUserEmail) return -1;
            if (b.email === currentUserEmail) return 1;
            return a.name.localeCompare(b.name);
          });

          return sortedMembers.map((m, i) => {
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
          });
        })()}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">

        <div className="bg-white p-6 rounded-xl shadow flex items-center justify-between">


          <div>
            <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-3">
              <span className="text-3xl">{mathSpace.icon}</span>
              {mathSpace.title}
            </h1>
            <p className="text-gray-600">{mathSpace.desc}</p>
          </div>


          <Link
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 rounded-md text-xs font-medium shadow"
          >
            Exit
          </Link>

        </div>


        <div className="bg-white rounded-xl shadow p-6 flex flex-col flex-1 min-h-[500px]">

          <h3 className="text-lg font-semibold mb-3">Discussion</h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {messages.map((msg, i) => {
              const isMe = msg.sender === currentUserEmail;

              return (
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${isMe ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}>
                    <p className="text-xs font-semibold mb-1">
                      {isMe ? "You" : msg.name}
                    </p>
                    <p>{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              className="flex-1 p-3 border rounded-lg outline-purple-600"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button onClick={sendMessage} className="bg-purple-600 text-white px-6 py-2 rounded-lg">
              Send
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-120 bg-white border-l shadow-sm p-5 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Announcements</h2>

        <div className="flex gap-2 mb-4">
          <select
            className="p-2 border rounded-lg outline-purple-600"
            value={annLevel}
            onChange={(e) => setAnnLevel(e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="high">High Importance</option>
          </select>

          <input
            className="flex-1 p-2 border rounded-lg outline-purple-600"
            placeholder="Post announcement..."
            value={annInput}
            onChange={(e) => setAnnInput(e.target.value)}
          />

          <button
            onClick={sendAnnouncement}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Post
          </button>
        </div>

        <div className="space-y-3">
          {announcements.map((a, i) => {
            let bg = "bg-yellow-100 border-yellow-400";

            if (a.level === "high") bg = "bg-red-100 border-red-500";
            if (a.level === "medium") bg = "bg-orange-100 border-orange-400";
            if (a.level === "normal") bg = "bg-green-100 border-green-400";

            return (
              <div
                key={i}
                className={`relative border-l-4 p-3 rounded shadow-sm ${bg}`}
              >
                <span className="absolute -left-2 -top-2 text-xl">📍</span>

                <p className="text-sm font-medium text-gray-800">{a.text}</p>

                <p className="text-xs font-semibold text-gray-700 mt-1">
                  Posted by: {a.senderName || a.sender}
                </p>

                <p className="text-xs mt-1 text-gray-500">
                  {new Date(a.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}