import clientPromise from "../../../lib/mongodb";
import crypto from "crypto";
import nodemailer from "nodemailer";

console.log("ENV TEST EMAIL_USER:", process.env.EMAIL_USER);
console.log("ENV TEST EMAIL_PASS:", process.env.EMAIL_PASS);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection("users");

        const user = await users.findOne({ email });

        // DO NOT reveal whether email exists
        if (!user) {
            return res
                .status(200)
                .json({ message: "If that email exists, a reset link was sent." });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save token to user document
        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetTokenHash: tokenHash,
                    resetTokenExpiry: expiry,
                },
            }
        );

        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "https://yr4project.vercel.app";

        const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
            email
        )}`;

        // Validate env variables before sending email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("EMAIL_USER or EMAIL_PASS is missing from environment");
        }

        // Nodemailer setup
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Student Collaboration" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset your password",
            html: `
        <p>You requested a password reset.</p>
        <p>Click the link below:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>The link expires in <strong>1 hour</strong>.</p>
      `,
        });

        return res.status(200).json({
            message: "If that email exists, a reset link was sent.",
        });
    } catch (err) {
        console.error("request-reset error:", err);
        return res.status(500).json({ message: err.message || "Server error." });
    }
}