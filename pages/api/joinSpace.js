import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { spaceId, email, name } = req.body;

    if (!spaceId || !email || !name) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    // Prevent duplicate join
    await db.collection("spaces").updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $addToSet: {
          members: { email, name }
        }
      }
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Join space error:", err);
    return res.status(500).json({ success: false });
  }
}
