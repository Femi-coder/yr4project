import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { roomId } = req.query;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const messages = await db
            .collection("directMessages")
            .find({ roomId })
            .sort({ timestamp: 1 })
            .toArray();

        return res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching DM:", error);
        return res.status(500).json({ messages: [] });
    }
}
