"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Box } from "lucide-react";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 shadow-2xl border border-secondary/20">
        <Link href="/dashboard" className="text-secondary hover:text-primary transition flex items-center gap-2 mb-8 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </Link>
        
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-primary p-3 rounded-2xl">
            <Box className="text-accent w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter">Initialize Project</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Project Name</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full p-4 bg-background rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-bold text-primary"
              placeholder="e.g., Project Kraken"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-accent py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:brightness-125 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Allocating Resources..." : "Build Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}