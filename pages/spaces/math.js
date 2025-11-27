import { useEffect, useState } from "react";
import Link from "next/link";

export default function MathSpace() {
  const [mathSpace, setMathSpace] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    setCurrentUserEmail(localStorage.getItem("userEmail"));
  }, []);

  useEffect(() => {
    fetch("/api/getMathSpace")
      .then((res) => res.json())
      .then((data) => setMathSpace(data.space));
  }, []);

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
              <div>
                <p className="font-medium">{isYou ? "You" : m.name}</p>
                <p className="text-gray-500 text-sm">{m.email}</p>
              </div>

              {!isYou && (
                <Link
                  href={`/dm/${encodeURIComponent(m.email)}?name=${encodeURIComponent(m.name)}`}
                  className="text-purple-600 font-semibold text-sm hover:underline"
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

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-2">Announcements</h3>
          <p className="text-gray-600">No announcements yet.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Discussion</h3>
          <p className="text-gray-600">Start a conversation...</p>
        </div>
      </main>
    </div>
  );
}
