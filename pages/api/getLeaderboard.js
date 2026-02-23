import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const topUsers = await db
            .collection("users")
            .find({})
            .sort({ points: -1 })
            .limit(5)
            .project({ name: 1, points: 1 })
            .toArray();

        return res.status(200).json({ leaderboard: topUsers });

    } catch (error) {
        console.error("Leaderboard error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}