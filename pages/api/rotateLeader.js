import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const spaces = await db.collection("spaces").find().toArray();

        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

        for (let space of spaces) {
            if (!space.members || space.members.length === 0) continue;

            // Rotates only after 7 days passes
            if (Date.now() - space.lastRotation < ONE_WEEK) continue;

            // Calculates the next Leader index
            const nextIndex =
                (space.leaderIndex + 1) % space.members.length;
            const newLeader = space.members[nextIndex].email;

            await db.collection("spaces").updateOne(
                { _id: new ObjectId(space._id) },
                {
                    $set: {
                        leader: newLeader,
                        leaderIndex: nextIndex,
                        lastRotation: Date.now(),
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