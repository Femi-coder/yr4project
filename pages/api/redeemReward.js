import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {

        const { email, rewardId } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const user = await db.collection("users").findOne({ email });

        const reward = await db.collection("rewards").findOne({
            _id: new ObjectId(rewardId)
        });

        if (!user || !reward) {
            return res.status(404).json({ error: "User or reward not found" });
        }

        // Atomic safe update
        const result = await db.collection("users").findOneAndUpdate(
            {
                email,
                points: { $gte: reward.cost }
            },
            {
                $inc: { points: -reward.cost }
            },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(400).json({ error: "Not enough points" });
        }

        await db.collection("rewardHistory").insertOne({
            email,
            rewardName: reward.name,
            cost: reward.cost,
            timestamp: new Date()
        });

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Redeem error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}