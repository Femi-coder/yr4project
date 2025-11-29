import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    try {
        const { spaceId } = req.query;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const collection = db.collection("spaceMessages");

        const messages = await collection
            .find({ spaceId })
            .sort({ timestamp: 1 })
            .toArray();

        return res.status(200).json({ messages });
    } catch (error) {
        console.error("Error loading messages:", error);
        return res.status(500).json({ success: false });
    }
}
