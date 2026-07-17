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
    <div className="atmosphere grid-field min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="panel w-full max-w-2xl rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden relative z-10">

        {!loading && (
          <Link href={`/dashboard/${id}`} aria-label="Close and return to board" className="absolute top-8 right-8 text-muted hover:text-primary transition-colors z-10">
            <X size={24} aria-hidden="true" />
          </Link>
        )}

        <div className="bg-linear-to-br from-accent-deep/30 via-surface-2 to-black p-8 sm:p-12 text-primary border-b border-line">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-accent-bright w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Neural Analysis Active</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">New Incident</h2>
          <p className="text-muted text-sm mt-2">Dispatch a new report to the triage engine.</p>
        </div>

        <div className="p-8 sm:p-12 bg-surface/40">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
              {/* THE LOADING BUG PREVIEW */}
              <div className="w-full bg-black/40 p-6 rounded-3xl border-2 border-dashed border-line-strong flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="px-4 py-1.5 bg-accent-deep text-white rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
                    uploading
                  </span>
                  <p className="font-bold text-primary truncate">{form.title}</p>
                </div>
                <Loader2 className="w-6 h-6 text-accent-bright animate-spin shrink-0" aria-hidden="true" />
              </div>

              <div className="space-y-2" role="status" aria-live="polite">
                <h3 className="text-xl font-black text-primary tracking-tight">AI is predicting severity...</h3>
                <p className="text-secondary text-xs font-bold uppercase tracking-widest px-8">
                  Analyzing logs and calculating impact metrics
                </p>
              </div>

              {showRenderWarning && (
                <p className="text-warning text-[10px] font-black uppercase tracking-[0.15em] bg-warning/10 p-3 rounded-xl border border-warning/25">
                  Render can take upto 30 seconds to wake up from inactivity.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-8">
              <div className="space-y-3">
                <label htmlFor="summary" className="block text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Summary</label>
                <input
                  id="summary"
                  required
                  autoFocus
                  className="w-full p-5 bg-black/50 rounded-2xl border border-line outline-none focus:border-accent font-bold text-primary transition-colors"
                  placeholder="e.g., Critical database deadlock in checkout"
                  onChange={e => setForm({...form, title: e.target.value})}
                  value={form.title}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="context" className="block text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Context Details</label>
                <textarea
                  id="context"
                  required
                  rows={5}
                  className="w-full p-5 bg-black/50 rounded-2xl border border-line outline-none focus:border-accent font-medium text-primary transition-colors"
                  placeholder="Provide logs, reproduction steps, or impact metrics..."
                  onChange={e => setForm({...form, description: e.target.value})}
                  value={form.description}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-accent-deep text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-accent active:scale-[0.98] transition-all shadow-[0_18px_50px_-12px_rgba(26,102,255,0.7)] cursor-pointer"
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
