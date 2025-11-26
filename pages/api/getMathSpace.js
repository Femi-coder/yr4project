import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("studentcollaboration");

  const space = await db.collection("spaces").findOne({
    title: "Mathematics Study Lab",
  });

  res.json({ space });
}