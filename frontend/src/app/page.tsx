"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { ShieldCheck, Mail, Lock, CheckCircle, UserPlus, Sparkles, Zap, Target, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_PASSWORD_LENGTH = 8;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWakeupWarning, setShowWakeupWarning] = useState(false);

  const [flyer, setFlyer] = useState<{ show: boolean, type: 'returning' | 'new' }>({
    show: false, type: 'returning'
  });

  const isRegister = mode === "register";

  // Handle the Render wakeup timer
  useEffect(() => {
    if (!loading) {
      setShowWakeupWarning(false);
      return;
    }
    const timer = setTimeout(() => setShowWakeupWarning(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setLoading(true);
    try {
      const res = isRegister
        ? await api.post("/auth/register", { email, password, name })
        : await api.post("/auth/login", { email, password });

      setAuthToken(res.data.token);
      setFlyer({ show: true, type: res.data.newUser ? 'new' : 'returning' });
      setTimeout(() => router.push("/dashboard"), 1600);
    } catch (err: any) {
      setError(err.response?.data?.error || "Connection failed");
      setLoading(false);
    }
  };

  return (
    <div className="atmosphere grid-field flex min-h-screen bg-background items-center justify-center p-4 sm:p-6 relative overflow-hidden">

      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-bright/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="panel w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.9)] overflow-hidden relative z-10">

        {/* Left Side: Branding & Features */}
        <div className="bg-linear-to-br from-accent-deep/25 via-surface to-black p-10 sm:p-12 lg:p-16 flex flex-col justify-between text-primary relative overflow-hidden border-b lg:border-b-0 lg:border-r border-line">
           <div className="absolute top-0 right-0 p-4 text-accent-bright/10" aria-hidden="true"><Zap size={200} /></div>

           <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-accent-deep p-2 rounded-xl glow-sm"><ShieldCheck className="text-white w-6 h-6" /></div>
                <h1 className="text-2xl font-black tracking-tighter">TRIAGE</h1>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight mb-6">
                Predict. <br />Prioritize. <br />
                <span className="bg-linear-to-r from-accent-bright to-accent-soft bg-clip-text text-transparent">Resolve.</span>
              </h2>
              <p className="text-muted font-medium text-lg max-w-xs">
                The AI-Powered neural-link bug management system.
              </p>
           </div>

           <div className="space-y-4 mt-12 relative">
              {[
                { icon: <Target className="text-accent-bright shrink-0" />, text: "Easily report and manage Bugs" },
                { icon: <Sparkles className="text-accent-bright shrink-0" />, text: "Predicts Bug Severity using AI" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/3 p-4 rounded-2xl border border-line hover:border-line-strong transition-colors">
                  {f.icon}
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">{f.text}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-surface/60">
          <div className="mb-8">
            <h3 className="text-3xl font-black text-primary tracking-tighter mb-2">
              {isRegister ? "Create Account" : "Initialize Session"}
            </h3>
            <p className="text-secondary text-xs font-bold uppercase tracking-widest">
              {isRegister ? "Register a new operator" : "Enter credentials to gain access"}
            </p>
          </div>

          {/* Mode switch */}
          <div className="flex gap-1 p-1 bg-black/40 border border-line rounded-2xl mb-8" role="tablist">
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${
                  mode === m ? "bg-accent-deep text-white" : "text-muted hover:text-primary"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div role="alert" className="bg-danger/10 text-danger text-[10px] font-black p-4 rounded-xl border border-danger/30 uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isRegister && (
                <div className="relative group">
                  <label htmlFor="name" className="sr-only">Display name</label>
                  <User aria-hidden="true" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-bright transition-colors" />
                  <input
                    id="name" type="text" placeholder="Display Name (optional)" autoComplete="name"
                    className="w-full p-5 pl-14 rounded-2xl border border-line bg-black/40 text-primary focus:border-accent outline-none font-bold transition-colors"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="relative group">
                <label htmlFor="email" className="sr-only">Work Email</label>
                <Mail aria-hidden="true" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-bright transition-colors" />
                <input
                  id="email" type="email" placeholder="Work Email" required autoComplete="email"
                  className="w-full p-5 pl-14 rounded-2xl border border-line bg-black/40 text-primary focus:border-accent outline-none font-bold transition-colors"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative group">
                <label htmlFor="password" className="sr-only">Secure Password</label>
                <Lock aria-hidden="true" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-bright transition-colors" />
                <input
                  id="password" type="password" placeholder="Secure Password" required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
                  className="w-full p-5 pl-14 rounded-2xl border border-line bg-black/40 text-primary focus:border-accent outline-none font-bold transition-colors"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isRegister && (
                <p className="text-muted text-[10px] font-black uppercase tracking-widest pl-1">
                  Minimum {MIN_PASSWORD_LENGTH} characters
                </p>
              )}
            </div>

            <div className="space-y-4">
              <button
                type="submit" disabled={loading}
                className="w-full bg-accent-deep text-white font-black py-5 rounded-2xl hover:bg-accent active:scale-[0.98] transition-all shadow-[0_18px_50px_-12px_rgba(26,102,255,0.7)] hover:shadow-[0_18px_60px_-8px_rgba(26,102,255,0.95)] uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
              >
                {loading && <Loader2 aria-hidden="true" className="animate-spin w-4 h-4" />}
                {loading
                  ? (isRegister ? "Creating Account..." : "Authenticating...")
                  : (isRegister ? "Create Account" : "Establish Link")}
              </button>

              <p className="text-center text-muted text-xs font-medium">
                {isRegister ? (
                  <>Already have an account?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-accent-bright font-bold hover:text-accent-soft transition-colors cursor-pointer">Sign in</button>
                  </>
                ) : (
                  <>New here?{" "}
                    <button type="button" onClick={() => switchMode("register")} className="text-accent-bright font-bold hover:text-accent-soft transition-colors cursor-pointer">Create an account</button>
                  </>
                )}
              </p>

              <AnimatePresence>
                {showWakeupWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-warning/10 border border-warning/25 rounded-xl text-center"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-warning leading-relaxed">
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
            className="fixed bottom-0 z-100 flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl font-black uppercase tracking-widest text-sm bg-surface-2 text-primary border border-accent glow"
          >
            {flyer.type === 'returning' ? <CheckCircle className="text-accent-bright" /> : <UserPlus className="text-accent-bright" />}
            <span>{flyer.type === 'returning' ? 'Welcome back, operator' : 'New operator registered'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
