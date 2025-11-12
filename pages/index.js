import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userEmail = localStorage.getItem("userEmail");

    if (userEmail) {
      router.push("/dashboard"); // If logged in, go to dashboard
    } else {
      router.push("/login"); // Otherwise, go to login
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <p className="text-slate-600 text-lg font-medium">
        Redirecting to your workspace...
      </p>
    </div>
  );
}
