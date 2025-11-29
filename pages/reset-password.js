import { useState } from "react";
import { useRouter } from "next/router";

export default function ResetPassword() {
  const router = useRouter();
  const { token, email } = router.query;

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/confirm-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  if (!token || !email) return <p>Invalid reset link.</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        <label className="block text-sm font-medium mb-2">New Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-md mb-4"
        />

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded-md"
        >
          Update Password
        </button>

        {message && (
          <p className="text-center text-sm mt-3 text-gray-600">{message}</p>
        )}
      </form>
    </div>
  );
}
