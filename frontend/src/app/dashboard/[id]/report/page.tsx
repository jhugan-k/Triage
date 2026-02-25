"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Sparkles, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [showRenderWarning, setShowRenderWarning] = useState(false);

  // Dark mode persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('triage-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Timer logic for Render warning
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowRenderWarning(true);
      }, 5000);
    } else {
      setShowRenderWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/bugs", { ...form, dashboardId: id });
      router.push(`/dashboard/${id}`);
    } catch (err) {
      setLoading(false);
      alert("Submission failed. The AI service might be unreachable.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEFF1] dark:bg-[#12181C] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1A2228] rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-black/5 dark:border-white/5">
        
        {!loading && (
          <Link href={`/dashboard/${id}`} className="absolute top-8 right-8 text-secondary hover:text-primary dark:hover:text-white transition-colors">
            <X size={24} />
          </Link>
        )}
        
        <div className="bg-primary dark:bg-black/40 p-12 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-accent w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Neural Analysis Active</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">New Incident</h2>
          <p className="text-secondary text-sm mt-2 opacity-80">Dispatch a new report to the triage engine.</p>
        </div>

        <div className="p-12">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
              {/* THE LOADING BUG PREVIEW */}
              <div className="w-full bg-background dark:bg-black/20 p-6 rounded-3xl border-2 border-dashed border-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 bg-slate-400 dark:bg-slate-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    uploading
                  </span>
                  <p className="font-bold dark:text-white truncate max-w-[200px]">{form.title}</p>
                </div>
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black dark:text-white tracking-tight">AI is predicting severity...</h3>
                <p className="text-secondary text-xs font-bold uppercase tracking-widest px-8">
                  Analyzing logs and calculating impact metrics
                </p>
              </div>

              {showRenderWarning && (
                <p className="text-amber-500 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.15em] bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 animate-in slide-in-from-bottom-2 duration-700">
                  Render can take upto 30 seconds to wake up from inactivity.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Summary</label>
                <input 
                  required
                  autoFocus
                  className="w-full p-5 bg-background dark:bg-black/20 rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-bold dark:text-white placeholder:text-secondary/50"
                  placeholder="e.g., Critical database deadlock in checkout"
                  onChange={e => setForm({...form, title: e.target.value})}
                  value={form.title}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Context Details</label>
                <textarea 
                  required
                  rows={5}
                  className="w-full p-5 bg-background dark:bg-black/20 rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-medium dark:text-white placeholder:text-secondary/50"
                  placeholder="Provide logs, reproduction steps, or impact metrics..."
                  onChange={e => setForm({...form, description: e.target.value})}
                  value={form.description}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-accent text-primary py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-accent/20"
              >
                Dispatch Incident
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}