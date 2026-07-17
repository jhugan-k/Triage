"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Box, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/dashboards", { name });
      router.push("/dashboard");
    } catch (err) {
      alert("Creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atmosphere grid-field min-h-screen bg-background flex items-center justify-center p-6">
      <div className="panel w-full max-w-md rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] relative z-10">
        <Link href="/dashboard" className="text-muted hover:text-accent-bright transition-colors flex items-center gap-2 mb-8 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Workspace
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="bg-accent-deep p-3 rounded-2xl glow-sm">
            <Box className="text-white w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter">Initialize Project</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="project-name" className="block text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Project Name</label>
            <input
              id="project-name"
              type="text"
              required
              autoFocus
              className="w-full p-4 bg-black/50 rounded-2xl border border-line outline-none focus:border-accent font-bold text-primary transition-colors"
              placeholder="e.g., Project Kraken"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-deep text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-accent transition-colors shadow-[0_18px_50px_-12px_rgba(26,102,255,0.7)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {loading ? "Allocating Resources..." : "Build Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
