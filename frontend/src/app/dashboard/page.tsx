"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "@/lib/api";
import { 
  Plus, Key, ArrowRight, Activity, Trash2, Box, LogOut, TrendingUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Dashboard {
  id: string;
  name: string;
  accessKey: string;
}

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Dashboard[]>("/dashboards")
      .then(res => setDashboards(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    console.log("System: Purging session...");
    localStorage.removeItem("token");
    setAuthToken(""); 
    window.location.href = "/"; 
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("CRITICAL: Permanent purge of this workspace?")) return;
    try {
      await api.delete(`/purge-workspace/${id}`);
      setDashboards(prev => prev.filter(db => db.id !== id));
    } catch (err) { alert("Purge failed."); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#EAEFEF]">
      <div className="w-10 h-10 border-4 border-[#25343F] border-t-[#FF9B51] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      {/* 
          NAVBAR BLOCK 
          We are using a fixed height and flex-row to ensure nothing is hidden.
      */}
      <nav className="bg-[#25343F] border-b border-white/10 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 h-24 flex justify-between items-center">
          
          {/* Left Side: Brand */}
          <div className="flex items-center gap-4">
            <div className="bg-[#FF9B51]/10 p-2.5 rounded-xl border border-[#FF9B51]/20">
              <Box className="text-[#FF9B51] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">TRIAGE</h1>
              <span className="text-[9px] font-bold text-[#BFC9D1] uppercase tracking-[0.3em]">Neural Hub</span>
            </div>
          </div>

          {/* Right Side: Navigation Actions */}
          <div className="flex items-center gap-6">
            
            {/* LOGOUT BUTTON - Explicitly styled for visibility */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all group cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#FF9B51]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
            </button>

            {/* NEW PROJECT BUTTON */}
            <Link 
              href="/dashboard/new" 
              className="bg-[#FF9B51] text-[#25343F] px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Project
            </Link>
            
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10">
        <header className="mb-12 flex items-center gap-4">
          <Activity className="text-[#FF9B51] w-5 h-5" />
          <h2 className="text-[#25343F]/40 text-[10px] font-black uppercase tracking-[0.4em]">Active Command Centers</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {dashboards.map((db) => (
              <motion.div
                key={db.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ y: -8 }}
              >
                <Link href={`/dashboard/${db.id}`} className="group relative block bg-white rounded-[2.5rem] p-10 shadow-2xl border border-[#BFC9D1]/20 overflow-hidden transition-all hover:border-[#FF9B51]/40">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF9B51]/5 rounded-bl-full" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <h3 className="text-3xl font-black text-[#25343F] tracking-tighter uppercase italic leading-none group-hover:text-[#FF9B51] transition-colors">
                      {db.name}
                    </h3>
                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => handleDeleteProject(e, db.id)}
                        className="p-3 bg-white shadow-sm border border-[#BFC9D1]/20 rounded-xl text-[#BFC9D1] hover:text-white hover:bg-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-3 bg-[#FF9B51]/10 rounded-xl border border-[#FF9B51]/20">
                        <TrendingUp className="w-4 h-4 text-[#FF9B51]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#EAEFEF]/50 px-4 py-2.5 rounded-xl border border-[#BFC9D1]/20 w-fit mb-10">
                    <Key className="w-3 h-3 text-[#BFC9D1]" />
                    <span className="text-[10px] font-black text-[#BFC9D1] tracking-widest uppercase">{db.accessKey}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#25343F] font-black text-[10px] tracking-[0.2em] relative z-10">
                    <span>OPEN BOARD</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}