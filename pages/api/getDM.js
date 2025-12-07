import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { roomId, sender, message, timestamp } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        await db.collection("directMessages").insertOne({
            roomId,
            sender,
            message,
            timestamp
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("DM Save Failed:", err);
        return res.status(500).json({ success: false });
    }
}