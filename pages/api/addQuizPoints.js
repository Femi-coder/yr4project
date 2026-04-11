import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const { email, points, quizId, spaceId } = req.body;

    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const existing = await db.collection("quizAttempts").findOne({
      quizId,
      userEmail: email
    });

    if (existing) {
      return res.status(400).json({ error: "Already attempted" });
    }

    await db.collection("quizAttempts").insertOne({
      quizId,
      spaceId,
      userEmail: email,
      score: points,
      completedAt: new Date()
    });

    await db.collection("users").updateOne(
      { email },
      {
        $inc: {
          points: points,
          totalPoints: points
        }
      }
    );

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}