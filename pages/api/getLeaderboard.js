import clientPromise from "../../lib/mongodb";

const reactionPoints = {
    like: 5,
    clap: 10,
    fire: 15,
};

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const users = await db
            .collection("users")
            .find({})
            .project({ name: 1, email: 1 })
            .toArray();

        const leaderboard = [];

        for (const user of users) {
            let totalPoints = 0;

            // 1. Reaction points from messages
            const messages = await db
                .collection("spaceMessages")
                .find({ sender: user.email })
                .toArray();

            for (const msg of messages) {
                if (!msg.reactions || msg.reactions.length === 0) continue;

                for (const reaction of msg.reactions) {
                    totalPoints += reactionPoints[reaction.type] || 0;
                }
            }

            // 2. Quiz points
            const quizAttempts = await db
                .collection("quizAttempts")
                .find({ userEmail: user.email })
                .toArray();

            for (const attempt of quizAttempts) {
                totalPoints += attempt.score || 0;
            }

            const leaderRewards = await db
                .collection("leaderHistory")
                .find({ email: user.email })
                .toArray();

            leaderRewards.forEach((l) => {
                totalPoints += l.points || 0;
            });

            leaderboard.push({
                name: user.name,
                email: user.email,
                totalPoints,
            });
        }

        leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

        return res.status(200).json({
            leaderboard: leaderboard.slice(0, 5),
        });

    } catch (error) {
        console.error("Leaderboard error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}