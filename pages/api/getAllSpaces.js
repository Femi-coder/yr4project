import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const spaces = await db.collection("spaces").find({}).toArray();

    res.status(200).json({ spaces });
  } catch (error) {
    console.error("Error fetching all spaces", error);
    res.status(500).json({ spaces: [] });
  }
}
