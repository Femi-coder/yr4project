import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { spaceId } = req.query;

    if (!spaceId) {
      return res.status(400).json({ error: "No spaceId provided" });
    }

    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
    });

    if (!space) {
      return res.status(404).json({ error: "Space not found" });
    }

    return res.status(200).json({ space });

  } catch (err) {
    console.error("GET SPACE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
