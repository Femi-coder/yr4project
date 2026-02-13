import { useState } from "react";
import { useRouter } from "next/router";

export default function CreateSpace() {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [icon, setIcon] = useState("📘");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const create = async () => {
        if (!title.trim() || !desc.trim()) {
            alert("Please fill in all fields");
            return;
        }

        setLoading(true);

        const email = localStorage.getItem("userEmail");
        const name = localStorage.getItem("userName");

        const res = await fetch("/api/createSpace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                desc,
                icon,
                creatorEmail: email,
                creatorName: name,
            }),
        });

        const data = await res.json();

        if (data.success) {
            router.push(`/spaces/${data.spaceId}`);
        } else {
            alert("Failed to create space");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6 space-y-4">

                <h1 className="text-xl font-semibold text-purple-700">Create New Space</h1>

                <input
                    className="w-full border p-3 rounded-lg outline-purple-600"
                    placeholder="Space name..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    className="w-full border p-3 rounded-lg outline-purple-600"
                    placeholder="Description..."
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />

                <input
                    type="text"
                    className="w-full border p-3 rounded-lg outline-purple-600 text-lg"
                    placeholder=" Optional icon (emoji)"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={3}
                />
                <button
                    onClick={create}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700"
                >
                    {loading ? "Creating..." : "Create Space"}
                </button>

            </div>
        </div>
    );
}
