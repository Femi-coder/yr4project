import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {

        const { email, points, quizId, spaceId } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const existingAttempt = await db.collection("quizAttempts").findOne({
            quizId,
            userEmail: email
        });

        if (existingAttempt) {
            return res.status(400).json({
                error: "You have already completed this quiz"
            });
        }

        //save attempt
        await db.collection("quizAttempts").insertOne({
            quizId,
            spaceId,
            userEmail: email,
            score: points,
            completedAt: new Date()
        });

        //add points to users
        await db.collection("users").updateOne(
            { email },
            { $inc: { points: points } }
        );

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Add quiz points error:", error);
        res.status(500).json({ error: "Server error" });
    }
}