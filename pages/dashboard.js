import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const mySpaces = [
  {
    title: "Nutrition & Health Research",
    desc: "Exchange insights on diet analysis, LPR studies, and food microbiology data.",
    members: 7,
    icon: "💜",
  },
  {
    title: "Software Development",
    desc: "Plan weekly sprints, assign tasks, and review project progress collaboratively.",
    members: 12,
    icon: "💻",
  },
  {
    title: "Entrepreneurship Start-Up Space",
    desc: "Pitch new business ideas and refine models through weekly challenges.",
    members: 5,
    icon: "🚀",
  },
  {
    title: "Automation & Robotics",
    desc: "Collaborate on robot assembly designs and algorithm testing.",
    members: 8,
    icon: "🤖",
  },
];

const discoverSpaces = [
  {
    title: "DevOps Automation",
    desc: "Discuss best practices, share tools, and collaborate on automating deployment.",
    icon: "📣",
  },
  {
    title: "Content Creation Hub",
    desc: "Brainstorm, plan, and produce high-quality content across various mediums.",
    icon: "👜",
  },
  {
    title: "Community Forum",
    desc: "Engage with peers, ask questions, and share knowledge across various topics.",
    icon: "💡",
  },
  {
    title: "Data Analytics Bootcamp",
    desc: "Collaborate on projects using Excel, SQL, and Power BI dashboards.",
    icon: "📈",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (!email) {
      router.push("/login");
    } else {
      setUser({ email, name });
    }
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg font-medium">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <button className="text-xl" title="Notifications">
              🔔
            </button>
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
              <span>850 Prob Points Acquired</span>
              
            </div>
          </div>

          {/* Your spaces */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">
              Your Collaborative Spaces
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {mySpaces.map((space) => (
                <div
                  key={space.title}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                        {space.icon}
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
                    <span className="text-gray-500">
                      👥 {space.members} Members
                    </span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs">
                        Open
                      </button>
                      <button className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 text-xs">
                        Leave
                      </button>
                    </div>
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
                  key={space.title}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg mb-2">
                      {space.icon}
                    </div>
                    <h3 className="font-semibold mb-1 text-sm md:text-base">
                      {space.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4">
                      {space.desc}
                    </p>
                  </div>
                  <button className="mt-auto w-full rounded-md bg-purple-600 text-white text-xs md:text-sm py-2">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Create Space button bottom-right */}
      <button className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full px-6 py-3 text-sm font-medium shadow-lg">
        Create Space
      </button>
    </div>
  );
}
