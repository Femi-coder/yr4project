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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">
        {mathSpace.title} Members
      </h1>
      <p className="text-gray-600 mb-6">{mathSpace.desc}</p>

      <div className="space-y-3">
        {mathSpace.members.length === 0 && (
          <p className="text-gray-500">No members yet.</p>
        )}

        {mathSpace.members
          .filter((m) => m.email !== currentUserEmail) //hides the current user
          .map((m, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white shadow-sm p-4 rounded-lg border"
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-gray-500">{m.email}</p>
              </div>

              <Link
                href={`/dm/${encodeURIComponent(m.email)}`}
                className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
              >
                DM
              </Link>
            </div>
          ))}

      </div>
    </div>
  );
}
