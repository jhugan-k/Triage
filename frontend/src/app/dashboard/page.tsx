"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, LayoutDashboard, Key, ArrowRight, TrendingUp, Activity, Trash2 } from "lucide-react";
import Link from "next/link";

interface Dashboard {
  id: string;
  name: string;
  accessKey: string;
}

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboards = async () => {
    try {
      const res = await api.get<Dashboard[]>("/dashboards");
      setDashboards(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboards", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  // --- NEW: PROJECT DELETION LOGIC ---
  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (!confirm("CRITICAL ACTION: This will permanently purge the project and all associated bug logs. Continue?")) return;

    try {
      // Change api.post to api.delete and remove the "/delete" suffix
      await api.delete(`/purge-workspace/${id}`); 
      setDashboards(prev => prev.filter(db => db.id !== id));
    } catch (err: any) {
      console.error("Purge Error Detail:", err.response?.data || err.message);
      alert("Purge sequence failed. Check backend connectivity.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#37474F] via-[#455A64] to-[#546E7A] relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#FF6E40]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#4FC3F7]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className="w-12 h-12 border-4 border-[#FF6E40] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-white tracking-[0.2em] text-sm uppercase">Loading Workspaces...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background with Tech Shapes */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#ECEFF1] via-[#CFD8DC] to-[#B0BEC5]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#FF6E40]/10 to-[#FF5252]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-[#4FC3F7]/10 to-[#81D4FA]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        
        {/* Tech-themed floating shapes (Circuit pattern logic remains) */}
        <div className="absolute top-20 left-[15%] opacity-10">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="20" cy="20" r="8" fill="#FF6E40" />
            <circle cx="100" cy="20" r="8" fill="#FF6E40" />
            <line x1="20" y1="20" x2="100" y2="20" stroke="#FF6E40" strokeWidth="3" />
            <circle cx="60" cy="60" r="12" fill="#FF6E40" />
          </svg>
        </div>

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <nav className="bg-gradient-to-r from-[#37474F] via-[#455A64] to-[#546E7A] p-6 shadow-2xl border-b border-[#FF6E40]/20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF6E40]/10 p-2 rounded-xl border-2 border-[#FF6E40]/30">
                <LayoutDashboard className="text-[#FF6E40] w-7 h-7" />
              </div>
              <div>
                <h1 className="text-white font-black text-3xl tracking-wide uppercase">TRIAGE</h1>
                <p className="text-[#FF6E40] text-[9px] font-bold tracking-[0.25em] uppercase">BUG TRACKING SYSTEM</p>
              </div>
            </div>
            <Link href="/dashboard/new" className="bg-gradient-to-r from-[#FF6E40] to-[#FF5252] text-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF6E40]/30 w-full sm:w-auto justify-center tracking-widest">
              <Plus className="w-5 h-5" /> NEW PROJECT
            </Link>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-8 md:p-10">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[#FF6E40]" />
              <h2 className="text-[#546E7A] text-xs font-bold uppercase tracking-[0.25em]">ACTIVE WORKSPACES</h2>
            </div>
          </div>

          {dashboards.length === 0 ? (
            <div className="text-center py-32 bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#546E7A]/30 shadow-xl">
              <p className="font-black uppercase tracking-[0.3em] text-[#546E7A] text-sm mb-2">NO PROJECTS YET</p>
              <Link href="/dashboard/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6E40] to-[#FF5252] text-white px-8 py-3 rounded-full font-bold text-sm mt-4">
                <Plus className="w-5 h-5" /> CREATE PROJECT
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((db, index) => (
                <Link 
                  key={db.id} 
                  href={`/dashboard/${db.id}`} 
                  className="group bg-white/95 backdrop-blur-md p-8 rounded-2xl border-2 border-[#37474F]/10 hover:border-[#FF6E40]/50 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6E40]/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  {/* PROJECT ACTIONS AREA */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    {/* TRASH ICON */}
                    <button 
                      onClick={(e) => handleDeleteProject(e, db.id)}
                      className="w-10 h-10 bg-white shadow-sm border border-secondary/20 rounded-xl flex items-center justify-center text-secondary hover:text-white hover:bg-[#FF5252] transition-all hover:rotate-12"
                      title="Delete Project"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {/* VISUAL TREND ICON */}
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF6E40]/10 to-[#FF5252]/5 rounded-xl flex items-center justify-center border border-[#FF6E40]/20">
                      <TrendingUp className="w-5 h-5 text-[#FF6E40]" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-4">
                    <h3 className="text-2xl font-black text-[#37474F] mb-4 group-hover:text-[#FF6E40] transition-colors tracking-tight uppercase">
                      {db.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 bg-[#ECEFF1] px-4 py-2 rounded-xl mb-6 border border-[#546E7A]/10 w-fit">
                      <Key className="w-3.5 h-3.5 text-[#546E7A]" />
                      <span className="text-[#546E7A] font-bold text-[10px] uppercase tracking-wider">{db.accessKey}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[#37474F] font-black text-xs group-hover:text-[#FF6E40] transition-colors tracking-widest">
                      <span>OPEN BOARD</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF6E40]/0 via-[#FF6E40]/5 to-[#FF5252]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}