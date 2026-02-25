"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { ShieldCheck, Mail, Lock, CheckCircle, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [flyer, setFlyer] = useState<{ show: boolean, type: 'returning' | 'new' }>({
    show: false,
    type: 'returning'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token);

      setFlyer({
        show: true,
        type: res.data.newUser ? 'new' : 'returning'
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || "Connection failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-6 relative overflow-hidden">
      
      <AnimatePresence>
        {flyer.show && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl font-black uppercase tracking-widest text-sm"
            style={{
              backgroundColor: flyer.type === 'returning' ? '#BBF7D0' : '#166534',
              color: flyer.type === 'returning' ? '#000000' : '#FFFFFF',
              border: flyer.type === 'returning' ? '2px solid #86EFAC' : '2px solid #14532D'
            }}
          >
            {flyer.type === 'returning' ? (
              <><CheckCircle className="w-5 h-5" /><span>Welcome back!</span></>
            ) : (
              <><UserPlus className="w-5 h-5" /><span>New user registered!</span></>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-secondary/30 relative z-10">
        <div className="bg-primary p-10 text-center">
          <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-white text-3xl font-black tracking-tighter text-center">TRIAGE</h1>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-danger/10 text-danger text-[10px] font-black p-3 rounded-xl text-center uppercase tracking-widest border border-danger/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
              <input
                type="email"
                placeholder="Work Email"
                className="w-full p-4 pl-12 rounded-xl border border-secondary/50 bg-background/30 focus:border-accent outline-none font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
              <input
                type="password"
                placeholder="Secure Password"
                className="w-full p-4 pl-12 rounded-xl border border-secondary/50 bg-background/30 focus:border-accent outline-none font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || flyer.show}
            className="w-full bg-accent text-primary font-black py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Processing..." : "Initialize Session"}
          </button>
        </form>
      </div>
    </div>
  );
}