import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

const reactionPoints = {
    like: 5,
    clap: 10,
    fire: 15,
};

export default async function handler(req, res) {
    try {
        const { spaceId } = req.query;

        if (!spaceId) {
            return res.status(400).json({ error: "Space ID required" });
        }

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const space = await db.collection("spaces").findOne({
            _id: new ObjectId(spaceId),
        });

        if (!space) {
            return res.status(404).json({ error: "Space not found" });
        }

        const leaderboard = [];

        for (let member of space.members) {

            let spacePoints = 0;

            // Quiz points
            const quizAttempts = await db.collection("quizAttempts").find({
                userEmail: member.email,
                spaceId: spaceId
            }).toArray();

            for (const attempt of quizAttempts) {
                spacePoints += attempt.score || 0;
            }

            //Leader rewards 
            const leaderHistory = await db.collection("leaderHistory").find({
                email: member.email,
                spaceId: spaceId
            }).toArray();

            for (const entry of leaderHistory) {
                if (entry.points > 0) {
                    spacePoints += entry.points;
                }
            }

            // Reaction points
            const messages = await db.collection("spaceMessages").find({
                sender: member.email,
                spaceId: spaceId
            }).toArray();

            for (const msg of messages) {
                for (const reaction of msg.reactions || []) {
                    spacePoints += reactionPoints[reaction.type] || 0;
                }
            }

            leaderboard.push({
                name: member.name || member.email.split("@")[0],
                email: member.email,
                points: spacePoints,
            });
        }

        leaderboard.sort((a, b) => b.points - a.points);

        return res.status(200).json({ leaderboard });

    } catch (error) {
        console.error("Space leaderboard error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}