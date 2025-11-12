import { useState } from "react";

export default function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        course: "",
        year: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Registration failed");
                return;
            }

            alert("Registered successfully!");

        } catch (error) {
            console.error(error);
            alert("Something went wrong. Try again.");
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
                        Create or join spaces, share resources, and work with your classmates
                        in one focused workspace.
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
                        Let&apos;s Get Started <span>🚀</span>
                    </h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Sign up your account to join your collaboration spaces.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />

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

                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />

                        <input
                            type="text"
                            name="course"
                            placeholder="Course (Optional)"
                            value={formData.course}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />

                        <input
                            type="text"
                            name="year"
                            placeholder="Year (Optional)"
                            value={formData.year}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />

                        <button
                            type="submit"
                            className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            Continue
                        </button>
                    </form>

                    <p className="text-[10px] text-slate-400 mt-3">
                        By continuing, you agree to our Terms &amp; Conditions and Privacy Policy.
                    </p>

                    <p className="text-sm text-slate-500 mt-4">
                        Already have an account?{" "}
                        <a href="/login" className="text-indigo-600 font-medium hover:underline">
                            Log in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
