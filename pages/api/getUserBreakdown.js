import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

const reactionPoints = {
    like: 5,
    clap: 10,
    fire: 15,
};

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const messages = await db
            .collection("spaceMessages")
            .find({ sender: email })
            .toArray();

        let totalPoints = 0;
        const spaceBreakdown = {};

        for (const msg of messages) {
            if (!msg.reactions || msg.reactions.length === 0) continue;

            for (const reaction of msg.reactions) {
                const points = reactionPoints[reaction.type] || 0;

                totalPoints += points;

                if (!spaceBreakdown[msg.spaceId]) {
                    spaceBreakdown[msg.spaceId] = 0;
                }

                spaceBreakdown[msg.spaceId] += points;
            }
        }

        const quizAttempts = await db
            .collection("quizAttempts")
            .find({ userEmail: email })
            .toArray();

        for (const attempt of quizAttempts) {

            const quizId = attempt.quizId;

            const space = await db.collection("spaces").findOne({
                "quizzes._id": new ObjectId(quizId)
            });

            if (!space) continue;

            const spaceId = space._id.toString();


            if (!spaceBreakdown[spaceId]) {
                spaceBreakdown[spaceId] = 0;
            }

            spaceBreakdown[spaceId] += attempt.score;

            totalPoints += attempt.score;
        }

        const spaceIds = Object.keys(spaceBreakdown);

        const spaces = await db
            .collection("spaces")
            .find({
                _id: { $in: spaceIds.map((id) => new ObjectId(id)) },
            })
            .toArray();

        const spaceMap = {};
        spaces.forEach((space) => {
            spaceMap[space._id.toString()] = space.title;
        });

        // Convert object to array
        const breakdownArray = Object.keys(spaceBreakdown).map((spaceId) => ({
            spaceId,
            spaceName: spaceMap[spaceId] || "Unknown Space",
            points: spaceBreakdown[spaceId],
        }));

        const user = await db.collection("users").findOne({ email });

        return res.status(200).json({
            totalPoints: user.points || 0,
            breakdown: breakdownArray,
        });

    } catch (error) {
        console.error("User breakdown error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}