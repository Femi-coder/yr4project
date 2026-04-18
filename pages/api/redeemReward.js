import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {

        const { email, rewardId } = req.body;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const user = await db.collection("users").findOne({ email });

        const reward = await db.collection("rewards").findOne({
            _id: new ObjectId(rewardId)
        });

        if (!user || !reward) {
            return res.status(404).json({ error: "User or reward not found" });
        }

        // Atomic safe update
        const result = await db.collection("users").findOneAndUpdate(
            {
                email,
                points: { $gte: reward.cost }
            },
            {
                $inc: { points: -reward.cost }
            },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(400).json({ error: "Not enough points" });
        }

        await db.collection("rewardHistory").insertOne({
            email,
            rewardName: reward.name,
            cost: reward.cost,
            timestamp: new Date()
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.sendMail({
            from: `"Student Collaboration" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reward Redemption Confirmation",
            html: `
                <h2>Reward Redeemed</h2>
                <p>You successfully redeemed:</p>
                <strong>${reward.name}</strong>
                <p>Points used: ${reward.cost}</p>
                <p>Your remaining points have been updated.</p>
                <br/>
                <p>Keep engaging to earn more rewards.</p>
            `,
        });


        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Redeem error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}