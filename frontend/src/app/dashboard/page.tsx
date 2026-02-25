"use client";
import { useEffect, useState } from "react";
import { api, logout } from "@/lib/api";
import { Plus, LayoutDashboard, Key, ArrowRight, TrendingUp, Activity, Trash2, LogOut, LogIn, X, User, Ghost, Box, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Dashboard {
  id: string; name: string; accessKey: string;
}

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const res = await api.get<Dashboard[]>("/dashboards");
        setDashboards(res.data);
        const token = localStorage.getItem('token');
        if (token) setUserEmail(JSON.parse(atob(token.split('.')[1])).email);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchDashboards();
  }, []);

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);
    try {
      await api.post("/dashboards/join", { accessKey: accessKeyInput });
      setIsJoinModalOpen(false);
      const res = await api.get<Dashboard[]>("/dashboards");
      setDashboards(res.data);
    } catch (err: any) { alert(err.response?.data?.error || "Key invalid"); }
    finally { setJoinLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-primary text-white font-black">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-[#ECEFF1] relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#25343F 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      <nav className="bg-primary p-6 shadow-2xl relative z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-accent w-7 h-7" />
            <h1 className="text-white font-black text-3xl tracking-tighter">TRIAGE</h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setIsJoinModalOpen(true)} className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Join Workspace</button>
             <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary shadow-xl hover:scale-105 transition-all"><User size={24} /></button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl p-4 border border-secondary/20">
                    <p className="text-[10px] font-black uppercase text-secondary mb-1">Operator Email</p>
                    <p className="font-bold text-primary truncate mb-4">{userEmail}</p>
                    <button onClick={logout} className="w-full flex items-center justify-between bg-danger/10 text-danger p-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Terminate <LogOut size={14} /></button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-10 flex flex-col relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <Activity className="text-accent w-4 h-4" />
          <h2 className="text-secondary text-[10px] font-black uppercase tracking-[0.3em]">Neural Workspaces</h2>
        </div>

        {dashboards.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center pb-20"
          >
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-accent/20 blur-[60px] rounded-full" />
               <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl border border-white">
                 <Ghost size={80} className="text-secondary/40" />
               </div>
               <div className="absolute -top-2 -right-2 bg-accent p-3 rounded-2xl shadow-lg animate-bounce">
                 <Sparkles size={20} className="text-primary" />
               </div>
            </div>
            
            <h3 className="text-4xl font-black text-primary tracking-tighter mb-4">No Active Links Found</h3>
            <p className="text-secondary max-w-sm font-medium text-lg mb-10 opacity-70">
              You haven't established any project workspaces yet. Create a new link or use an access key to join an existing one.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard/new" className="bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:brightness-125 transition-all">Initialize New Project</Link>
              <button onClick={() => setIsJoinModalOpen(true)} className="bg-white text-primary border-2 border-primary/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary/5 transition-all">Enter Access Key</button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dashboards.map((db) => (
              <Link key={db.id} href={`/dashboard/${db.id}`} className="group bg-white rounded-[2rem] p-10 shadow-lg border border-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="bg-accent/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent group-hover:text-primary transition-colors text-accent">
                   <Box size={28} />
                </div>
                <h3 className="text-2xl font-black text-primary tracking-tighter mb-2">{db.name}</h3>
                <div className="flex items-center gap-2 text-secondary font-mono text-xs font-bold uppercase tracking-widest opacity-60">
                  <Key size={14} /> {db.accessKey}
                </div>
                <div className="mt-10 flex justify-end">
                   <div className="bg-background p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight size={20} />
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button only if dashboards exist */}
      {dashboards.length > 0 && (
        <Link href="/dashboard/new" className="fixed bottom-10 right-10 bg-accent text-primary p-6 rounded-full shadow-[0_20px_50px_rgba(255,155,81,0.4)] hover:scale-110 active:scale-95 transition-all z-[100]">
           <Plus size={32} strokeWidth={3} />
        </Link>
      )}

      {/* Join Modal (Existing code) */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-primary/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl relative border border-white/20">
            <button onClick={() => setIsJoinModalOpen(false)} className="absolute top-8 right-8 text-secondary"><X /></button>
            <h2 className="text-3xl font-black text-primary mb-2">Access Key</h2>
            <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-10">Enter workspace link ID</p>
            <form onSubmit={handleJoinProject} className="space-y-6">
              <input
                className="w-full p-6 rounded-2xl border-2 border-secondary/10 bg-background focus:border-accent outline-none font-black text-center text-3xl tracking-[0.4em] uppercase"
                value={accessKeyInput} onChange={(e) => setAccessKeyInput(e.target.value.toUpperCase())} placeholder="000000"
              />
              <button disabled={joinLoading} className="w-full bg-primary text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:brightness-125 transition-all">
                {joinLoading ? "Linking..." : "Establish Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}