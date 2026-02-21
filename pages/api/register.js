import clientPromise from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { name, email, password, confirmPassword, course, year } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: "Please fill in all required fields." });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    try {
        const client = await clientPromise;
        const db = client.db("studentcollaboration");
        const users = db.collection("users");

        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await users.insertOne({
            name,
            email,
            password: hashedPassword,
            course: course || "",
            year: year || "",
            role: "student",
            
            // Gamification fields
            points: 0,
            reactionsReceived: 0,
            reactionsGiven: 0,

            createdAt: new Date(),

        
        });

        return res.status(201).json({ message: "Registration successful!" });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
