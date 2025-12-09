import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { spaceId, sender, text, timestamp } = req.body;

    console.log("Incoming body:", req.body);

    const client = await clientPromise;
    console.log("Client connected:", !!client);

    const db = client.db("studentcollaboration");

    const result = await db.collection("announcements").insertOne({
      spaceId: String(spaceId),
      sender,
      text,
      timestamp,
    });

    console.log("Insert result:", result);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Announcement DB error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
