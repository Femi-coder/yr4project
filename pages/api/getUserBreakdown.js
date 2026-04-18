import clientPromise from "../../lib/mongodb";

const reactionPoints = {
    like: 5,
    clap: 10,
    fire: 15,
};

export default async function handler(req, res) {
    try {
        const { email } = req.query;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const spaces = await db.collection("spaces").find({}).toArray();

        const breakdown = [];

        let totalPoints = 0;

        for (const space of spaces) {

            let points = 0;

            // Quiz
            const quizzes = await db.collection("quizAttempts").find({
                userEmail: email,
                spaceId: space._id.toString()
            }).toArray();

            quizzes.forEach(q => {
                points += q.score || 0;
            });

            // Leader rewards
            const leaders = await db.collection("leaderHistory").find({
                email,
                spaceId: space._id.toString()
            }).toArray();

            leaders.forEach(l => {
                if (l.points > 0) points += l.points;
            });

            // Reactions
            const messages = await db.collection("spaceMessages").find({
                sender: email,
                spaceId: space._id.toString()
            }).toArray();

            messages.forEach(msg => {
                (msg.reactions || []).forEach(r => {
                    points += reactionPoints[r.type] || 0;
                });
            });

            if (points !== 0) {
                breakdown.push({
                    spaceName: space.title,
                    points
                });

                totalPoints += points;
            }
        }

        res.status(200).json({
            totalPoints,
            breakdown
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}