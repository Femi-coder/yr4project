import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({ error: "Message ID is required" });
        }

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const result = await db.collection("spaceMessages").updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { pinned: true } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Message not found" });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Pin message error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}