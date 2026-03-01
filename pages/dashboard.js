import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [fade, setFade] = useState(false);
  const [points, setPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBreakdown, setUserBreakdown] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);


  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (!email) {
      router.push("/login");
    } else {
      setUser({ email, name });
    }
  }, [router]);

  useEffect(() => {
    fetch("/api/getLeaderboard")
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard || []));
  }, []);

  useEffect(() => {
    fetch("/api/getAllSpaces")
      .then(res => res.json())
      .then(data => setSpaces(data.spaces || []));
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    fetch(`/api/getUserPoints?email=${user.email}`)
      .then(res => res.json())
      .then(data => setPoints(data.points || 0));
  }, [user]);

  useEffect(() => {
    if (!user?.email || spaces.length === 0) return;

    const SOCKET_URL =
      process.env.NODE_ENV === "development"
        ? "http://localhost:4000"
        : "https://socket-server-cyma.onrender.com";

    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    // Join ALL spaces user belongs to
    const mySpaces = spaces.filter((space) =>
      space.members.some((m) => m.email === user.email)
    );

    mySpaces.forEach((space) => {
      socket.emit("join-space", space._id);
    });

    // Listen for space messages
    socket.on("space-message", (data) => {
      if (data.sender !== user.email) {
        setHasNotification(true);
      }
    });

    // Listen for DMs
    socket.on("receive-message", (data) => {
      if (data.sender !== user.email) {
        setHasNotification(true);
      }
    });

    return () => socket.disconnect();
  }, [user, spaces]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg font-medium">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  const mySpaces = spaces.filter((space) =>
    space.members.some(
      (m) => m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    )
  );

  const discoverSpaces = spaces.filter(
    (space) =>
      !space.members.some(
        (m) => m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      )
  );


  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setLoadingBreakdown(true);
    setUserBreakdown(null);

    try {
      const res = await fetch(
        `/api/getUserBreakdown?email=${user.email}`
      );
      const data = await res.json();

      setUserBreakdown(data);
    } catch (err) {
      console.error("Error fetching breakdown:", err);
    }

    setLoadingBreakdown(false);
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 flex flex-col transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"
        }`}
    >
      {/* Top Navbar */}
      <header className="w-full bg-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-lg">Dashboard</span>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden sm:flex items-center bg-purple-500/70 rounded-full px-3 py-1 w-64">
              <input
                className="bg-transparent outline-none text-sm placeholder-purple-100 flex-1"
                placeholder="Search spaces..."
              />
            </div>

            {/* Icons */}
            <div
              onClick={() => setHasNotification(false)}
              className="relative cursor-pointer"
            >
              🔔

              {hasNotification && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </div>
            <button className="text-xl" title="Rewards">
              🎁
            </button>

            {/* User + logout */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-semibold"
                title={user.email}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs bg-purple-500 hover:bg-purple-700 rounded-full px-3 py-1 transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Welcome + points */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">
              Welcome, {user.name || "User"}!
            </h1>
            <div className="flex items-center gap-2 text-purple-600 font-medium">
              <span className="text-xl">🏅</span>
              <span> {points} pts achieved </span>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-6 text-purple-700">
            🏆 Top Contributors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-10">
            {leaderboard.map((user, index) => {

              const medal =
                index === 0 ? "🥇" :
                  index === 1 ? "🥈" :
                    index === 2 ? "🥉" :
                      `#${index + 1}`;

              return (
                <div
                  onClick={() => handleUserClick(user)}
                  className="bg-gray-50 rounded-xl p-5 text-center shadow-md 
             cursor-pointer
             transform hover:-translate-y-2 
             hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-3xl mb-2">{medal}</div>

                  <p className="font-semibold text-gray-800 truncate">
                    {user.name}
                  </p>

                  <p className="text-purple-600 font-bold mt-2">
                    {user.points || 0} pts
                  </p>
                </div>
              );
            })}

          </div>

          {/* My spaces */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Your Collaborative Spaces</h2>

            {mySpaces.length === 0 && (
              <p className="text-gray-500 mb-4">You haven't joined any spaces yet.</p>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {mySpaces.map((space) => (
                <div
                  key={space._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                        {space.icon || "📘"}
                      </div>
                    </div>

                    <h3 className="font-semibold mb-1 text-sm md:text-base">
                      {space.title}
                    </h3>

                    <p className="text-xs md:text-sm text-gray-600 mb-4">
                      {space.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs md:text-sm mt-2">
                    <span className="text-gray-500">👥 {space.members.length} Members</span>

                    <button
                      onClick={() => {
                        setFade(true);
                        setTimeout(() => {
                          router.push(`/spaces/${space._id}`);
                        }, 400);
                      }}
                      className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Discover spaces */}
          <section className="mb-16">
            <h2 className="text-xl font-semibold mb-4">Discover Spaces</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {discoverSpaces.map((space) => (
                <div
                  key={space._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg mb-2">
                      {space.icon || "📘"}
                    </div>

                    <h3 className="font-semibold mb-1 text-sm md:text-base">
                      {space.title}
                    </h3>

                    <p className="text-xs md:text-sm text-gray-600 mb-4">
                      {space.desc}
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      const res = await fetch("/api/joinSpace", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          spaceId: space._id,
                          email: user.email,
                          name: user.name,
                        }),
                      });

                      if (res.status === 200) {
                        setFade(true);
                        setTimeout(() => router.reload(), 400);
                      } else {
                        alert("Join failed.");
                      }
                    }}
                    className="mt-auto w-full rounded-md bg-purple-600 text-white text-xs md:text-sm py-2"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>


      {/* Create Space button bottom-right */}
      <button
        onClick={() => router.push("/create-space")}
        className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full px-6 py-3 text-sm font-medium shadow-lg"
      >
        Create Space
      </button>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">

            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold mb-4 text-purple-700">
              👤 {selectedUser.name}
            </h2>

            {loadingBreakdown && (
              <p className="text-gray-500">Loading...</p>
            )}

            {!loadingBreakdown && userBreakdown && (
              <>
                <p className="mb-4 font-medium">
                  🏅 Total Points:{" "}
                  <span className="text-purple-600">
                    {userBreakdown.totalPoints}
                  </span>
                </p>

                <div className="space-y-3">
                  {userBreakdown.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-lg flex justify-between"
                    >
                      <span className="font-medium">
                        {item.spaceName}
                      </span>
                      <span className="text-purple-600 font-semibold">
                        {item.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
