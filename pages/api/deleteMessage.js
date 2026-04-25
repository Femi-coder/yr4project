import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messageId, userEmail } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const result = await db.collection("spaceMessages").deleteOne({
            _id: messageId,
            sender: userEmail,
        });

        if (result.deletedCount === 0) {
            return res.status(403).json({
                error: "You can only delete your own messages",
            });
        }

        res.status(200).json({ success: true });

    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Server error" });
    }
}