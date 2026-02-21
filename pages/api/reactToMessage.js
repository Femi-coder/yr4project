import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

const reactionPoints = {
    like: 5,
    clap: 10,
    fire: 15,
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messageId, reactorEmail, reactionType } = req.body;

        // Basic validation
        if (!messageId || !reactorEmail || !reactionType) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!reactionPoints[reactionType]) {
            return res.status(400).json({ error: "Invalid reaction type" });
        }

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const messagesCollection = db.collection("spaceMessages");
        const usersCollection = db.collection("users");

        // Fetch message
        const message = await messagesCollection.findOne({
            _id: new ObjectId(messageId),
        });

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Prevent self-reaction
        if (message.sender === reactorEmail) {
            return res.status(400).json({ error: "Cannot react to your own message" });
        }

        // Ensure reactions array exists
        let reactions = message.reactions || [];

        // Check if user already reacted
        const existingReactionIndex = reactions.findIndex(
            (r) => r.email === reactorEmail
        );

        let pointsDifference = 0;

        // New Reaction
        if (existingReactionIndex === -1) {
            reactions.push({
                email: reactorEmail,
                type: reactionType,
                timestamp: Date.now(),
            });

            pointsDifference = reactionPoints[reactionType];
        }

        // Same Reaction Clicked Again (Remove)
        else if (reactions[existingReactionIndex].type === reactionType) {
            const oldType = reactions[existingReactionIndex].type;
            pointsDifference = -reactionPoints[oldType];

            reactions.splice(existingReactionIndex, 1);
        }

        // Reaction Changed
        else {
            const oldType = reactions[existingReactionIndex].type;
            const oldPoints = reactionPoints[oldType];
            const newPoints = reactionPoints[reactionType];

            pointsDifference = newPoints - oldPoints;

            reactions[existingReactionIndex] = {
                email: reactorEmail,
                type: reactionType,
                timestamp: Date.now(),
            };
        }

        // Update message reactions
        await messagesCollection.updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { reactions } }
        );

        // Update sender's points safely
        if (pointsDifference !== 0) {
            await usersCollection.updateOne(
                { email: message.sender },
                {
                    $inc: {
                        points: pointsDifference,
                    },
                }
            );
        }

        return res.status(200).json({
            success: true,
            reactions,
            pointsChange: pointsDifference,
        });
    } catch (error) {
        console.error("Reaction error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}