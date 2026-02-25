"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "@/lib/api"; // Added setAuthToken
import { 
  Plus, Key, ArrowRight, Activity, Trash2, Box, LogOut 
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
    localStorage.removeItem("token");
    setAuthToken(""); 
    window.location.href = "/"; // Force refresh to clear state
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("CRITICAL: Permanent purge of this workspace and all associated logs?")) return;

    try {
      await api.delete(`/purge-workspace/${id}`);
      setDashboards(prev => prev.filter(db => db.id !== id));
    } catch (err) {
      alert("Purge failed. System offline.");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin" />
        <p className="font-black text-[10px] tracking-[0.3em] uppercase opacity-40">Loading Workspaces...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      {/* NAVIGATION BLOCK */}
      <nav className="bg-primary p-8 shadow-2xl border-b border-white/5 sticky top-0 z-50 backdrop-blur-md bg-primary/90">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-accent/10 p-2.5 rounded-xl border border-accent/20">
              <Box className="text-accent w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">TRIAGE</h1>
              <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.3em]">Neural Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* LOGOUT BUTTON */}
            <button 
              onClick={handleLogout}
              className="text-secondary hover:text-white flex items-center gap-2 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>

            <Link href="/dashboard/new" className="bg-accent text-primary px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Workspace
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10">
        <header className="mb-12 flex items-center gap-4">
          <Activity className="text-accent w-5 h-5" />
          <h2 className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em]">Active Command Centers</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {dashboards.map((db) => (
              <motion.div
                key={db.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
              >
                <Link href={`/dashboard/${db.id}`} className="group relative block bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 border border-secondary/20 overflow-hidden transition-all hover:border-accent/40">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-bl-full group-hover:bg-accent/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <h3 className="text-3xl font-black text-primary tracking-tighter uppercase italic leading-none group-hover:text-accent transition-colors">
                      {db.name}
                    </h3>
                    <button 
                      onClick={(e) => handleDeleteProject(e, db.id)}
                      className="p-3 text-secondary/30 hover:text-danger hover:bg-danger/5 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-background/50 px-4 py-2.5 rounded-xl border border-secondary/20 w-fit mb-10">
                    <Key className="w-3 h-3 text-secondary" />
                    <span className="text-[10px] font-black text-secondary tracking-widest uppercase">{db.accessKey}</span>
                  </div>

                  <div className="flex items-center justify-between text-primary font-black text-[10px] tracking-[0.2em] relative z-10">
                    <span>INITIALIZE BOARD</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {dashboards.length === 0 && (
          <div className="py-40 text-center border-4 border-dashed border-secondary/20 rounded-[3rem] bg-white/30 backdrop-blur-sm">
            <Box className="w-16 h-16 mx-auto mb-6 text-secondary/30" />
            <p className="font-black uppercase tracking-[0.5em] text-secondary text-xs">No active nodes detected</p>
          </div>
        )}
      </main>
    </div>
  );
}