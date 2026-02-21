import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const user = await db.collection("users").findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            points: user.points || 0,
        });

    } catch (error) {
        console.error("Get points error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}