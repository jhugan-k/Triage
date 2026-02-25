"use client";
import { useEffect, useState } from "react";
import { api, logout } from "@/lib/api";
import { Plus, LayoutDashboard, Key, ArrowRight, TrendingUp, Activity, Trash2, LogOut, LogIn, X, User } from "lucide-react";
import Link from "next/link";

interface Dashboard {
  id: string;
  name: string;
  accessKey: string;
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
        // Attempt to get user info from local storage or a quick check
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserEmail(payload.email);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchDashboards();
  }, []);

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("CRITICAL ACTION: Purge project?")) return;
    try {
      await api.delete(`/purge-workspace/${id}`);
      setDashboards(prev => prev.filter(db => db.id !== id));
    } catch (err) {
      alert("Purge failed.");
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);
    try {
      await api.post("/dashboards/join", { accessKey: accessKeyInput });
      setAccessKeyInput("");
      setIsJoinModalOpen(false);
      const res = await api.get<Dashboard[]>("/dashboards");
      setDashboards(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to join.");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#37474F] text-white font-black">LOADING...</div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#ECEFF1]">
      <nav className="bg-gradient-to-r from-[#37474F] via-[#455A64] to-[#546E7A] p-6 shadow-2xl relative z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-[#FF6E40] w-7 h-7" />
            <h1 className="text-white font-black text-3xl tracking-wide">TRIAGE</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4" /> JOIN PROJECT
            </button>

            {/* PROFILE ICON & DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#37474F] hover:scale-105 transition-all shadow-lg"
              >
                <User size={24} />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl p-4 border border-secondary/20 z-50">
                  <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Authenticated As</p>
                  <p className="font-bold text-[#37474F] truncate mb-4">{userEmail}</p>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-between bg-danger/10 hover:bg-danger hover:text-white text-danger p-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                  >
                    Terminate Session <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* FIXED NEW PROJECT BUTTON - BOTTOM RIGHT */}
      <Link 
        href="/dashboard/new" 
        className="fixed bottom-10 right-10 z-[100] bg-gradient-to-r from-[#FF6E40] to-[#FF5252] text-white px-8 py-5 rounded-full font-black text-sm flex items-center gap-3 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-[#FF6E40]/40 uppercase tracking-widest"
      >
        <Plus className="w-6 h-6" /> New Project
      </Link>

      <main className="max-w-7xl mx-auto p-10">
        <div className="flex items-center gap-3 mb-10">
          <Activity className="w-5 h-5 text-[#FF6E40]" />
          <h2 className="text-[#546E7A] text-xs font-bold uppercase tracking-[0.25em]">ACTIVE WORKSPACES</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((db) => (
            <div key={db.id} className="group relative">
              <Link href={`/dashboard/${db.id}`} className="block bg-white rounded-2xl p-8 shadow-lg border border-white hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#FF6E40]/10 p-3 rounded-xl"><TrendingUp className="text-[#FF6E40]" /></div>
                  <button onClick={(e) => handleDeleteProject(e, db.id)} className="text-secondary hover:text-danger"><Trash2 size={18} /></button>
                </div>
                <h3 className="font-black text-[#37474F] text-xl mb-2">{db.name}</h3>
                <div className="flex items-center gap-2 text-secondary font-mono text-xs font-bold uppercase tracking-widest">
                  <Key size={12} /> {db.accessKey}
                </div>
                <div className="mt-6 flex justify-end text-[#FF6E40]"><ArrowRight /></div>
              </Link>
            </div>
          ))}
        </div>
      </main>

      {/* JOIN MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsJoinModalOpen(false)} className="absolute top-8 right-8 text-secondary"><X /></button>
            <h2 className="text-3xl font-black text-[#37474F] mb-8">Access Key</h2>
            <form onSubmit={handleJoinProject} className="space-y-6">
              <input
                className="w-full p-5 rounded-2xl border-2 border-secondary/20 focus:border-[#FF6E40] outline-none font-black text-center text-2xl tracking-[0.3em] uppercase"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value.toUpperCase())}
                placeholder="000000"
              />
              <button disabled={joinLoading} className="w-full bg-[#37474F] text-white py-5 rounded-2xl font-black uppercase tracking-widest">
                {joinLoading ? "Verifying..." : "Join Workspace"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}