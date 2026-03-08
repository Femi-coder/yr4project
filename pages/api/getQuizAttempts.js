import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {

    const { email } = req.query;

    const client = await clientPromise;
    const db = client.db("studentcollaboration");

    const attempts = await db
        .collection("quizAttempts")
        .find({ userEmail: email })
        .toArray();

    const quizIds = attempts.map(a => a.quizId);

    res.status(200).json({ quizIds });
}