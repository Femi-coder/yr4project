import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {

  try {
    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const rewards = await db.collection("rewards").find({}).toArray();

    res.status(200).json({ rewards });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }

}