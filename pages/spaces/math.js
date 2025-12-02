import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import io from "socket.io-client";

export default function MathSpace() {
  const [mathSpace, setMathSpace] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDay = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDayLabel = (ts) => {
    const messageDate = new Date(ts);
    const today = new Date();

    const diff = today.setHours(0, 0, 0, 0) - messageDate.setHours(0, 0, 0, 0);
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff === 0) return "Today";
    if (diff === oneDay) return "Yesterday";

    return formatDay(ts);
  };




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
    <div className="flex h-screen bg-gray-100">

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
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shadow-sm">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="leading-tight">
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

        {/* SPACE HEADER */}
        <div className="bg-white p-6 rounded-xl shadow flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-3">
            <span className="text-3xl">{mathSpace.icon || "📘"}</span>
            {mathSpace.title}
          </h1>

          <p className="text-gray-600">{mathSpace.desc}</p>
          <p className="text-sm text-purple-700 font-medium">
            👥 {mathSpace.members.length} Members
          </p>
        </div>

        {/* DISCUSSION AREA */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col h-[480px]">
          <h3 className="text-lg font-semibold mb-3">Discussion</h3>

          {/* CHAT BOX */}
          <div
            className="flex-1 overflow-y-auto pr-2 space-y-3"
            id="discussion-box"
          >
            {(() => {
              let lastDate = null;

              return messages.map((msg, i) => {
                const dayLabel = getDayLabel(msg.timestamp);
                const isNewDay = dayLabel !== lastDate;
                lastDate = dayLabel;

                const isMe = msg.sender === currentUserEmail;

                return (
                  <div key={i}>
                    {/* Day Divider */}
                    {isNewDay && (
                      <div className="text-center my-3">
                        <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                          {dayLabel}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${isMe
                            ? "bg-purple-600 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-800 rounded-bl-none"
                          }`}
                      >
                        <p className="text-xs font-semibold mb-1">
                          {isMe ? "You" : msg.name}
                        </p>
                        <p>{msg.message}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}

          </div>

          {/* INPUT BOX */}
          <div className="mt-4 flex gap-3">
            <input
              className="flex-1 p-3 border rounded-lg shadow-sm outline-purple-600"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow"
            >
              Send
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-64 bg-white border-l shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Announcements</h2>

        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            No announcements yet.
          </p>
        </div>
      </aside>
    </div>
  );



}

