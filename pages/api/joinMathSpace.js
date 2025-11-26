import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const { email, name } = req.body;

    await db.collection("spaces").updateOne(
      { title: "Mathematics Study Lab" },
      { $addToSet: { members: { email, name } } }
    );

    res.status(200).json({ message: "Joined successfully" });
  } catch (error) {
    console.error("joinMathSpace error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}