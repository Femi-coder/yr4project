import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const {
            _id,
            spaceId,
            sender,
            name,
            type,
            content,
            message,
            timestamp,
            replyTo
        } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const collection = db.collection("spaceMessages");


        const existing = await collection.findOne({ _id });

        if (existing) {
            return res.status(200).json({ success: true });
        }

        await collection.insertOne({
            _id,
            spaceId,
            sender,
            name,
            type: type || "text",
            content: content || message,
            timestamp,
            replyTo: replyTo || null
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error saving message:", error);
        return res.status(500).json({ success: false });
    }
}