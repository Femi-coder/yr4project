import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { spaceId } = req.query;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const announcements = await db
            .collection("announcements")
            .find({ spaceId })
            .sort({ timestamp: 1 })
            .toArray();

        return res.status(200).json({ announcements });

    } catch (err) {
        console.error("Error fetching announcements:", err);
        return res.status(500).json({ announcements: [] });
    }
}
