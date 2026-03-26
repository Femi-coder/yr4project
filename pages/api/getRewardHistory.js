import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {

        const { email } = req.query;

        const client = await clientPromise;
        const db = client.db("studentcollaboration");

        const history = await db
            .collection("rewardHistory")
            .find({ email })
            .sort({ timestamp: -1 })
            .toArray();

        res.status(200).json({ history });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }

}