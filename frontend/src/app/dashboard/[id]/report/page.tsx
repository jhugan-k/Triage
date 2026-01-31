"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post("/bugs", { ...form, dashboardId: id });
    router.push(`/dashboard/${id}`);
  };

  return (
    <div className="min-h-screen bg-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden relative">
        <Link href={`/dashboard/${id}`} className="absolute top-6 right-6 text-secondary hover:text-primary"><X /></Link>
        <div className="bg-primary p-12 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-accent w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest text-secondary">Neural Analysis Active</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">New Incident</h2>
        </div>
        <form onSubmit={submit} className="p-12 space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Summary</label>
            <input 
              required
              className="w-full p-4 bg-background rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-bold"
              placeholder="Brief overview of the failure"
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Details</label>
            <textarea 
              required
              rows={4}
              className="w-full p-4 bg-background rounded-2xl border-none outline-none focus:ring-2 focus:ring-accent font-medium"
              placeholder="Describe logs, impacts, and behavior..."
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>
          <button className="w-full bg-accent text-primary py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition shadow-xl disabled:opacity-50">
            {loading ? "Analyzing..." : "Dispatch Incident"}
          </button>
        </form>
      </div>
    </div>
  );
}