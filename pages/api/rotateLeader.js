import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
const { spaceId } = req.query;

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        let spaces;

        if (spaceId) {
            const space = await db.collection("spaces").findOne({
                _id: new ObjectId(spaceId)
            });
            spaces = space ? [space] : [];
        } else {
            spaces = await db.collection("spaces").find().toArray();
        }

        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

        const quizCount = space.quizzesThisWeek || 0;
        const currentLeader = space.leader;

        if (currentLeader) {
            let pointsChange = 0;

            if (quizCount >= 3) {
                pointsChange = 40;
            } else {
                pointsChange = -20;
            }

            await db.collection("users").updateOne(
                { email: currentLeader },
                {
                    $inc: { points: pointsChange }
                }
            );
        }

        for (let space of spaces) {
            // Skip if no members
            if (!space.members || space.members.length === 0) continue;

            // Handle missing leaderIndex
            const currentIndex = Number.isInteger(space.leaderIndex)
                ? space.leaderIndex
                : 0;

            // Handle missing lastRotation
            const lastRotation = space.lastRotation ?? 0;

            // Rotate only after 7 days
            if (Date.now() - lastRotation < ONE_WEEK) continue;

            // Calculate next index safely
            const nextIndex =
                (currentIndex + 1) % space.members.length;

            const nextMember = space.members[nextIndex];

            //Prevent crash if member invalid
            if (!nextMember || !nextMember.email) {
                console.log("Invalid member at index:", nextIndex);
                continue;
            }

            const newLeader = nextMember.email;

            await db.collection("spaces").updateOne(
                { _id: new ObjectId(space._id) },
                {
                    $set: {
                        leader: newLeader,
                        leaderIndex: nextIndex,
                        lastRotation: Date.now(),
                        quizzesThisWeek: 0
                    },
                }
            );
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Rotation error:", err);
        res.status(500).json({ error: "Rotation failed" });
    }
}