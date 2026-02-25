"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  // Maintain dark mode class on mount if saved
  useEffect(() => {
    const savedTheme = localStorage.getItem('triage-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/bugs", { ...form, dashboardId: id });
      router.push(`/dashboard/${id}`);
    } catch (err) {
      setLoading(false);
      alert("Submission failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEFF1] dark:bg-[#12181C] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1A2228] rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-black/5 dark:border-white/5">
        <Link href={`/dashboard/${id}`} className="absolute top-8 right-8 text-secondary hover:text-primary dark:hover:text-white transition-colors">
          <X size={24} />
        </Link>
        
        <div className="bg-primary dark:bg-black/40 p-12 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-accent w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Neural Analysis Active</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">New Incident</h2>
          <p className="text-secondary text-sm mt-2 opacity-80">Dispatch a new report to the triage engine.</p>
        </div>

        <form onSubmit={submit} className="p-12 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Summary</label>
            <input 
              required
              autoFocus
              className="w-full p-5 bg-background dark:bg-black/20 rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-bold dark:text-white placeholder:text-secondary/50"
              placeholder="e.g., Critical database deadlock in checkout"
              onChange={e => setForm({...form, title: e.target.value})}
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
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-accent text-primary py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
          >
            {loading ? "Analyzing Context..." : "Dispatch Incident"}
          </button>
        </form>
      </div>
    </div>
  );
}