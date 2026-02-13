import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, desc, icon, creatorEmail, creatorName } = req.body;

    if (!title || !desc || !creatorEmail || !creatorName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const result = await db.collection("spaces").insertOne({
      title,
      desc,
      icon,
      members: [
        { email: creatorEmail, name: creatorName }
      ],
      createdAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      spaceId: result.insertedId.toString(),
    });

  } catch (err) {
    console.error("Error creating space:", err);
    return res.status(500).json({ error: "Failed to create space" });
  }
}
