import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { spaceId, title, questions, createdBy } = req.body;
    console.log("Received spaceId:", spaceId);

    if (!spaceId || !title || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await clientPromise;
    const db = client.db();

    const newQuiz = {
      _id: new ObjectId(),
      title,
      createdBy,
      createdAt: Date.now(),
      questions,
    };

    const result = await db.collection("spaces").updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $push: { quizzes: newQuiz },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Space not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Create quiz error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}