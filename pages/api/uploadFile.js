import clientPromise from "../../lib/mongodb";
import multer from "multer";

export const config = {
    api: {
        bodyParser: false,
    },
};

const upload = multer({
    storage: multer.diskStorage({
        destination: "./public/uploads",
        filename: (req, file, cb) => {
            const uniqueName = Date.now() + "-" + file.originalname;
            cb(null, uniqueName);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"));
        }
    },
});

export default async function handler(req, res) {
    upload.single("file")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { spaceId, sender, name } = req.body;
            const file = req.file;

            const client = await clientPromise;
            const db = client.db("studentcollaboration");

            const message = {
                spaceId,
                sender,
                name,
                type: "file",
                content: null,
                fileUrl: `/uploads/${file.filename}`,
                originalName: file.originalname,
                timestamp: Date.now(),
            };

            await db.collection("spaceMessages").insertOne(message);

            return res.status(200).json({ success: true, message });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Upload failed" });
        }
    });
}
