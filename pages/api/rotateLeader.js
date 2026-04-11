import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
    try {
        const { spaceId } = req.query;

        if (!spaceId) {
            return res.status(400).json({ error: "Missing spaceId" });
        }

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const space = await db.collection("spaces").findOne({
            _id: new ObjectId(spaceId),
        });

        if (!space || !space.members || space.members.length === 0) {
            return res.status(404).json({ error: "Invalid space" });
        }

        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        const lastRotation = space.lastRotation ?? 0;

        // Prevent rotation if not due
        if (Date.now() - lastRotation < ONE_WEEK) {
            return res.status(200).json({
                success: true,
                message: "Rotation not due yet",
            });
        }

        const currentLeader = space.leader;

        // Find current leader index safely
        let currentIndex = space.members.findIndex(
            (m) => m.email === currentLeader
        );

        if (currentIndex === -1) currentIndex = 0;

        // Count quizzes created by leader since last rotation
        const quizCount = (space.quizzes || []).filter(
            (q) =>
                q.createdBy === currentLeader &&
                q.createdAt >= lastRotation
        ).length;

        const pointsChange = quizCount >= 3 ? 40 : 0;

        // Apply points ONLY once
        if (!space.rotationProcessed && currentLeader) {
            await db.collection("users").updateOne(
                { email: currentLeader },
                {
                    $inc: {
                        points: pointsChange
                    }
                }
            );

            await db.collection("leaderHistory").insertOne({
                email: currentLeader,
                spaceId: space._id.toString(),
                quizzesPosted: quizCount,
                points: pointsChange,
                timestamp: Date.now(),
            });


            await db.collection("spaces").updateOne(
                { _id: new ObjectId(spaceId) },
                { $set: { rotationProcessed: true } }
            );
        }

        //  Rotate leader
        const nextIndex = (currentIndex + 1) % space.members.length;
        const newLeader = space.members[nextIndex].email;

        await db.collection("spaces").updateOne(
            { _id: new ObjectId(spaceId) },
            {
                $set: {
                    leader: newLeader,
                    leaderIndex: nextIndex,
                    lastRotation: Date.now(),
                    rotationProcessed: false, // reset for NEXT cycle
                    quizzes: [],
                },
            }
        );

        return res.status(200).json({
            success: true,
            newLeader,
            quizCount,
            pointsChange,
        });

    } catch (err) {
        console.error("Rotation error:", err);
        return res.status(500).json({ error: "Rotation failed" });
    }
}