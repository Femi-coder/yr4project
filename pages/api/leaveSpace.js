import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { spaceId, email } = req.body;

    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    await db.collection("spaces").updateOne(
      { _id: spaceId },
      {
        $pull: {
          members: { email },
        },
      }
    );

    res.status(200).json({ message: "Left space successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Leave failed" });
  }
}
