import { useEffect, useState } from "react";
import Link from "next/link";

export default function MathSpace() {
  const [mathSpace, setMathSpace] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");


  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setCurrentUserEmail(email);
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
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Top Section */}
      <div className="bg-purple-100 border border-purple-300 rounded-xl p-6 mb-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-purple-800 mb-2">
          {mathSpace.icon || "📘"} {mathSpace.title}
        </h1>
        <p className="text-gray-700 mb-3">{mathSpace.desc}</p>
        <span className="text-sm font-medium text-purple-700">
          👥 {mathSpace.members.length} Members
        </span>
      </div>

      {/* Members List */}
      <h2 className="text-xl font-semibold mb-4">Members</h2>

      <div className="space-y-3">
        {mathSpace.members.length === 0 && (
          <p className="text-gray-500">No members yet.</p>
        )}

        {mathSpace.members
          .filter((m) => m.email !== currentUserEmail)
          .map((m, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition"
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-gray-500">{m.email}</p>
              </div>

              <Link
                href={`/dm/${encodeURIComponent(m.email)}`}
                className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700 transition"
              >
                DM
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}