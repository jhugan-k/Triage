"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { ShieldCheck, Lock, Mail } from "lucide-react"; // Added Lock and Mail

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Changed from name to password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Sending email and password to backend
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed");
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
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-xs font-bold p-3 rounded-lg text-center uppercase tracking-wider">
              {error}
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-4 w-5 h-5 text-secondary" />
            <input
              type="email"
              placeholder="Work Email"
              className="w-full p-4 pl-12 rounded-xl border border-secondary/50 bg-background/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-secondary" />
            <input
              type="password" // Changed type to password
              placeholder="Password"
              className="w-full p-4 pl-12 rounded-xl border border-secondary/50 bg-background/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-primary font-black py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest text-sm"
          >
            {loading ? "Authenticating..." : "Initialize Session"}
          </button>
          
          <p className="text-[10px] text-secondary text-center uppercase tracking-tighter">
            New users will be registered automatically on first login.
          </p>
        </form>
      </div>
    </div>
  );
}