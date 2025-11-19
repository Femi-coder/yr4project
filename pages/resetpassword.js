import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ResetPassword() {
    const router = useRouter();
    const { token, email } = router.query;

    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (router.isReady && (!token || !email)) {
            setMsg("Invalid or missing reset link.");
        }
    }, [router.isReady, token, email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, password }),
            });

            const data = await res.json();
            setMsg(data.message);

            if (res.ok) {
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (err) {
            console.error(err);
            setMsg("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
                <h1 className="text-2xl font-semibold mb-4 text-center">
                    Reset Password
                </h1>

                {msg && (
                    <p className="mb-3 text-sm text-center text-gray-700">{msg}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            className="w-full border rounded-md px-3 py-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 rounded-md bg-purple-600 text-white font-medium disabled:opacity-60"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
