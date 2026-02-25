"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "@/lib/api";
import { Plus, Key, ArrowRight, Activity, Trash2, Box, LogOut, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboards").then(res => setDashboards(res.data)).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(""); 
    window.location.href = "/"; 
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Purge workspace?")) return;
    try {
      await api.delete(`/purge-workspace/${id}`);
      setDashboards(prev => prev.filter(db => db.id !== id));
    } catch (err) { alert("Failed"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#EAEFEF] font-black uppercase tracking-widest opacity-20">Link Established...</div>;

  return (
    <div className="min-h-screen bg-[#EAEFEF] pb-24">
      {/* HIGH-VISIBILITY NAVBAR */}
      <nav className="bg-[#25343F] border-b border-white/10 sticky top-0 z-[100] shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <Box className="text-[#FF9B51] w-6 h-6" />
            <h1 className="text-white font-black text-2xl tracking-tighter">TRIAGE</h1>
          </div>

          <div className="flex items-center gap-5">
            {/* LOGOUT BUTTON - Styled with a border to ensure it's seen */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500/50 text-white hover:bg-red-500 hover:text-white transition-all cursor-pointer z-[110]"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>

            <Link href="/dashboard/new" className="bg-[#FF9B51] text-[#25343F] px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
              + New Project
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboards.map(db => (
            <Link key={db.id} href={`/dashboard/${db.id}`} className="bg-white rounded-[2rem] p-10 shadow-xl border border-[#BFC9D1]/30 block relative group">
                <button onClick={(e) => handleDeleteProject(e, db.id)} className="absolute top-6 right-6 p-2 text-[#BFC9D1] hover:text-red-500 transition-colors z-20">
                  <Trash2 className="w-5 h-5" />
                </button>
                <h3 className="text-2xl font-black text-[#25343F] uppercase italic mb-6 group-hover:text-[#FF9B51] transition-colors">{db.name}</h3>
                <div className="flex items-center gap-2 bg-[#EAEFEF] px-3 py-1.5 rounded-lg w-fit mb-8">
                  <Key className="w-3 h-3 text-[#BFC9D1]" />
                  <span className="text-[9px] font-bold text-[#BFC9D1] uppercase">{db.accessKey}</span>
                </div>
                <div className="flex items-center gap-2 text-[#25343F] font-black text-[10px] tracking-widest">
                  OPEN BOARD <ArrowRight className="w-4 h-4" />
                </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}