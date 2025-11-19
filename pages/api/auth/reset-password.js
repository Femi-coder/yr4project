import clientPromise from "../../../lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ message: "Method not allowed" });

    const { email, token, password } = req.body;

    if (!email || !token || !password) {
        return res
            .status(400)
            .json({ message: "Email, token, and new password are required." });
    }

    try {
        const client = await clientPromise;
        const db = client.db("studentcollaboration");
        const users = db.collection("users");

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await users.findOne({
            email,
            resetTokenHash: tokenHash,
            resetTokenExpiry: { $gt: new Date() }, // not expired
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid or expired reset link." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await users.updateOne(
            { _id: user._id },
            {
                $set: { passwordHash },
                $unset: { resetTokenHash: "", resetTokenExpiry: "" },
            }
        );

        return res
            .status(200)
            .json({ message: "Password has been updated successfully." });
    } catch (err) {
        console.error("reset-password error:", err);
        return res.status(500).json({ message: "Server error." });
    }
}
