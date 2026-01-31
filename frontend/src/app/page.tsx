"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, name });
      setAuthToken(res.data.token);
      router.push("/dashboard");
    } catch (err) {
      alert("Backend unreachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-secondary/30">
        <div className="bg-primary p-10 text-center">
          <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-white text-3xl font-black tracking-tighter">TRIAGE</h1>
          <p className="text-secondary text-xs uppercase tracking-widest mt-2">Internal Security Engine</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          <input
            type="email"
            placeholder="Work Email"
            className="w-full p-4 rounded-xl border border-secondary/50 bg-background/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-4 rounded-xl border border-secondary/50 bg-background/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-primary font-black py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest text-sm"
          >
            {loading ? "Authenticating..." : "Initialize Session"}
          </button>
        </form>
      </div>
    </div>
  );
}