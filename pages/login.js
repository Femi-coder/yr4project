import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Login failed.");
                return;
            }

            // Save user info locally
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userRole", data.user.role);

            setMessage("Login successful");
            setTimeout(() => router.push("/dashboard"), 1000);
        } catch (err) {
            console.error(err);
            setMessage("Something went wrong.");
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50">
            {/* LEFT PANEL */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#6366f1,_transparent)]" />
                <div className="relative z-10 flex flex-col justify-center items-center w-full h-full px-10">
                    <p className="text-3xl font-medium text-indigo-600 mb-3">
                        Student Collaboration Platform
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                        Collaborate. Share. Lead.
                    </h2>
                    <p className="text-slate-600 mb-8 max-w-md text-center">
                        Log in to access your study groups, share files, and take part in
                        collaborative projects with your classmates.
                    </p>
                    <img
                        src="/studentcollab.jpg"
                        alt="Students collaborating"
                        className="w-6/5 max-w-xl h-auto object-contain drop-shadow-md"
                    />
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
                <div className="w-full max-w-md px-6 sm:px-10 py-10">
                    <h1 className="text-3xl font-semibold text-slate-900 mb-1">
                        Welcome back<span> 🚀</span>
                    </h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Log in to your account to join your collaboration spaces.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />

                        <button
                            type="submit"
                            className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            Continue
                        </button>

                        {message && (
                            <p
                                className={`text-center text-sm mt-2 ${message.includes("successful")
                                        ? "text-green-600"
                                        : "text-red-500"
                                    }`}
                            >
                                {message}
                            </p>
                        )}
                    </form>

                    <p className="text-[10px] text-slate-400 mt-3">
                        By continuing, you agree to our Terms &amp; Conditions and Privacy Policy.
                    </p>

                    <p className="text-sm text-slate-500 mt-4">
                        Don’t have an account?{" "}
                        <a
                            href="/register"
                            className="text-indigo-600 font-medium hover:underline"
                        >
                            Register
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}