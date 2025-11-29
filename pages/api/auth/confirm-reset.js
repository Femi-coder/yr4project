import clientPromise from "../../../lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    return res.status(400).json({ message: "Missing data." });
  }

  try {
    const client = await clientPromise;
    const db = client.db("studentcollaboration");
    const users = db.collection("users");

    // Hash token to check against DB
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Check user & matching token
    const user = await users.findOne({
      email,
      resetTokenHash: tokenHash,
      resetTokenExpiry: { $gt: new Date() }, // token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password & clear token
    await users.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetTokenHash: "", resetTokenExpiry: "" },
      }
    );

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("confirm-reset error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}
