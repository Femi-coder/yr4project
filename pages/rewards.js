import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Rewards() {

  const router = useRouter();

  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(0);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (!email) {
      router.push("/login");
    } else {
      setUser({ email, name });
    }
  }, []);

  useEffect(() => {
    fetch("/api/getRewards")
      .then(res => res.json())
      .then(data => setRewards(data.rewards || []));
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");

    fetch(`/api/getUserPoints?email=${email}`)
      .then(res => res.json())
      .then(data => setPoints(data.points || 0));
  }, []);

  useEffect(() => {

    const email = localStorage.getItem("userEmail");

    fetch(`/api/getRewardHistory?email=${email}`)
      .then(res => res.json())
      .then(data => setHistory(data.history || []));

  }, [])

  const nextReward =
    rewards
      .filter(r => r.cost > points)
      .sort((a, b) => a.cost - b.cost)[0]?.cost || 100;

  const progress = Math.min((points / nextReward) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <h1 className="text-3xl font-semibold text-purple-700 mb-4">
        🎁 Rewards Store
      </h1>

      <div className="mb-6">
        <p className="text-gray-600">
          You have <span className="text-purple-600 font-semibold">{points}</span> points
        </p>

        {rewards.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">
              Progress to next reward ({nextReward} pts)
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>


      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {rewards.map((r) => (
          <div
            key={r._id}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200
            transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
          >

            {/* TOP (colored header) */}
            <div className="bg-purple-500 text-white p-4 relative">

              <div className="absolute -bottom-3 left-4 w-6 h-6 bg-white rounded-full"></div>
              <div className="absolute -bottom-3 right-4 w-6 h-6 bg-white rounded-full"></div>

              <p className="text-xs opacity-80">Reward Voucher</p>

              <p className="text-lg font-semibold">
                {r.name}
              </p>

              <p className="text-sm mt-1">
                {r.cost} pts
              </p>
            </div>

            {/* DOTTED LINE */}
            <div className="border-t border-dashed border-gray-300"></div>

            {/* BOTTOM */}
            <div className="p-4">

              <p className="text-sm text-gray-700 mb-2">
                Redeem this reward using your points.
              </p>

              <button
                disabled={points < r.cost}
                onClick={async () => {

                  const res = await fetch("/api/redeemReward", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: user.email,
                      rewardId: r._id
                    })
                  });

                  const data = await res.json();

                  if (!res.ok) {
                    alert(data.error);
                    return;
                  }

                  alert("Reward redeemed!");
                  router.reload();

                }}
                className={`w-full py-2 rounded-md text-sm font-medium ${points < r.cost
                  ? "bg-red-300 text-gray-400"
                  : "bg-green-500 text-white hover:bg-gray-800"
                  }`}
              >
                Redeem
              </button>

            </div>

          </div>


        ))}


      </div>
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-purple-700 mb-4">
          🎟️ Redeemed Vouchers
        </h2>

        {history.length === 0 && (
          <p className="text-gray-500 text-sm">
            No rewards redeemed yet
          </p>
        )}

        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h._id}
              className="bg-purple-500 border rounded-lg p-3 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-medium text-white">
                  {h.rewardName}
                </p>
                <p className="text-xs text-white">
                  {new Date(h.timestamp).toLocaleString()}
                </p>
              </div>

              <span className="text-white font-semibold">
                {h.cost} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

