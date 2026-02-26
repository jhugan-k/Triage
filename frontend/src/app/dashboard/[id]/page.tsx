"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { ShieldCheck, Mail, Lock, CheckCircle, UserPlus, Sparkles, Zap, Target, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWakeupWarning, setShowWakeupWarning] = useState(false);

  const [flyer, setFlyer] = useState<{ show: boolean, type: 'returning' | 'new' }>({
    show: false, type: 'returning'
  });

  // Handle the Render wakeup timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowWakeupWarning(true);
      }, 5000); // Appear after 5 seconds of waiting
    } else {
      setShowWakeupWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      setFlyer({ show: true, type: res.data.newUser ? 'new' : 'returning' });
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Connection failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EAEFEF] items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden relative z-10 border border-white">
        
        {/* Left Side: Branding & Features */}
        <div className="bg-primary p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={200} /></div>
           
           <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-accent p-2 rounded-xl"><ShieldCheck className="text-primary w-6 h-6" /></div>
                <h1 className="text-2xl font-black tracking-tighter">TRIAGE</h1>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight mb-6">
                Predict. <br />Prioritize. <br /><span className="text-accent">Resolve.</span>
              </h2>
              <p className="text-secondary font-medium text-lg max-w-xs opacity-80">
                The world's first neural-link bug management system.
              </p>
           </div>

           <div className="space-y-6">
              {[
                { icon: <Target className="text-accent" />, text: "Automated Severity Prediction" },
                { icon: <Sparkles className="text-accent" />, text: "Neural Content Analysis" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  {f.icon}
                  <span className="text-sm font-bold uppercase tracking-widest">{f.text}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-10">
            <h3 className="text-3xl font-black text-primary tracking-tighter mb-2">Initialize Session</h3>
            <p className="text-secondary text-sm font-bold uppercase tracking-widest">Enter credentials to gain access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-danger/10 text-danger text-[10px] font-black p-4 rounded-xl border border-danger/20 uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-accent transition-colors" />
                <input
                  type="email" placeholder="Work Email" required
                  className="w-full p-5 pl-14 rounded-2xl border-2 border-secondary/20 bg-background/30 focus:border-accent outline-none font-bold transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-accent transition-colors" />
                <input
                  type="password" placeholder="Secure Password" required
                  className="w-full p-5 pl-14 rounded-2xl border-2 border-secondary/20 bg-background/30 focus:border-accent outline-none font-bold transition-all"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit" disabled={loading}
                className="w-full bg-accent text-primary font-black py-5 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-accent/20 uppercase tracking-[0.2em] text-sm disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading && <Loader2 className="animate-spin w-4 h-4" />}
                {loading ? "Authenticating..." : "Establish Link"}
              </button>

              <AnimatePresence>
                {showWakeupWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 leading-relaxed">
                      Render may take ~50 seconds to wake up from inactivity.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {flyer.show && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: -40, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 z-[100] flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl font-black uppercase tracking-widest text-sm bg-primary text-white border-2 border-accent"
          >
            {flyer.type === 'returning' ? <CheckCircle className="text-accent" /> : <UserPlus className="text-accent" />}
            <span>{flyer.type === 'returning' ? 'Welcome back, operator' : 'New operator registered'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}