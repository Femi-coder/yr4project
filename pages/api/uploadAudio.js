import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {

    const form = new IncomingForm();
    const uploadDir = path.join(process.cwd(), "/public/audio");

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Upload failed" });
        }

        const file = Array.isArray(files.audio) ? files.audio[0] : files.audio;

        const fileName = path.basename(file.filepath);

        const audioUrl = `/audio/${fileName}`;

        res.status(200).json({
            success: true,
            audioUrl
        });

    });

}
