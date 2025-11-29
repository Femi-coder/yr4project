import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { spaceId, sender, name, message, timestamp } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const collection = db.collection("spaceMessages");

        await collection.insertOne({
            spaceId,
            sender,
            name,
            message,
            timestamp,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error saving message:", error);
        return res.status(500).json({ success: false });
    }
}
