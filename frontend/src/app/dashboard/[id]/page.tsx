"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { api, setAuthToken } from "@/lib/api"; // Added setAuthToken
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertOctagon, AlertTriangle, Info, CheckCircle2, 
  Trash2, ArrowLeft, ShieldAlert, Clock, Activity, Fingerprint, Search, LogOut 
} from "lucide-react";
import Link from "next/link";

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Normal" | "Low";
  status: "OPEN" | "RESOLVED";
  createdAt: string;
}

const severityConfig = {
  High: { color: "#EF4444", icon: AlertOctagon, label: "CRITICAL_THREAT" },
  Normal: { color: "#FF9B51", icon: AlertTriangle, label: "DEGRADED_OPS" },
  Low: { color: "#3B82F6", icon: Info, label: "STABLE_NOTICE" },
};

export default function BugBoard() {
  const { id } = useParams();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [bugRes, dashRes] = await Promise.all([
          api.get<Bug[]>(`/dashboards/${id}/bugs`),
          api.get(`/dashboards/${id}`)
        ]);
        setBugs(bugRes.data);
        setDashboard(dashRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken("");
    window.location.href = "/";
  };

  const activeBugs = useMemo(() => 
    bugs.filter(b => b.status === 'OPEN' && b.title.toLowerCase().includes(search.toLowerCase())), 
    [bugs, search]
  );
  
  const resolvedBugs = useMemo(() => 
    bugs.filter(b => b.status === 'RESOLVED'), 
    [bugs]
  );

  const handleAction = async (bugId: string, action: 'resolve' | 'delete') => {
    try {
      if (action === 'resolve') {
        await api.patch(`/bugs/${bugId}/resolve`);
        setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: 'RESOLVED' } : b));
      } else {
        if (!confirm("Confirm permanent data purge?")) return;
        await api.delete(`/bugs/${bugId}`);
        setBugs(prev => prev.filter(b => b.id !== bugId));
      }
    } catch (err) { alert("Operation failed"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black tracking-tighter opacity-10 text-6xl">SYNCING...</div>;

  return (
    <div className="min-h-screen pb-24">
      {/* HEADER BLOCK */}
      <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-xl border-b border-white/5 px-10 py-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="bg-white/5 p-3 rounded-2xl text-secondary hover:text-accent transition-all">
              <ArrowLeft />
            </Link>
            <div className="space-y-1">
              <h1 className="text-white font-black text-4xl tracking-tighter uppercase italic">{dashboard?.name}</h1>
              <div className="flex items-center gap-3 text-[10px] font-black text-accent tracking-[0.4em]">
                <Activity className="w-3 h-3 animate-pulse" /> LIVE_MONITORING: {id?.toString().slice(0, 8)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
              <input 
                placeholder="Search Logs..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-accent/50 transition-all"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* LOGOUT BUTTON */}
            <button 
              onClick={handleLogout}
              className="text-secondary hover:text-white flex items-center gap-2 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>

            <Link href={`/dashboard/${id}/report`} className="bg-accent text-primary px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-accent/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
              <ShieldAlert className="w-4 h-4" /> New Log
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-16">
          {[
            { label: 'Active', val: activeBugs.length, color: 'text-accent' },
            { label: 'Critical', val: bugs.filter(b=>b.severity==='High'&&b.status==='OPEN').length, color: 'text-danger' },
            { label: 'Uptime', val: '99.9%', color: 'text-success' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-secondary/20 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-secondary mb-1">{s.label}</p>
              <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <section className="space-y-8">
          <h2 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.5em] mb-10 flex items-center gap-6">
            Operational Stream <div className="h-px bg-primary/5 flex-grow" />
          </h2>
          
          <AnimatePresence mode="popLayout">
            {activeBugs.map((bug) => (
              <BugCard key={bug.id} bug={bug} onResolve={() => handleAction(bug.id, 'resolve')} onDelete={() => handleAction(bug.id, 'delete')} />
            ))}
          </AnimatePresence>

          {activeBugs.length === 0 && (
            <div className="py-32 text-center border-4 border-dashed border-secondary/10 rounded-[3rem] opacity-20">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-6" />
              <p className="font-black uppercase tracking-[0.5em] text-sm">Clear Horizon: No Threats</p>
            </div>
          )}
        </section>

        {resolvedBugs.length > 0 && (
          <section className="mt-32 pt-16 border-t border-primary/5">
            <h2 className="text-[9px] font-black text-primary/20 uppercase tracking-[0.5em] mb-8">Archived Resolution History</h2>
            <div className="space-y-3">
              {resolvedBugs.map(bug => (
                <div key={bug.id} className="bg-white/40 border border-secondary/10 p-5 rounded-2xl flex justify-between items-center opacity-40 hover:opacity-100 transition-all group">
                   <div className="flex items-center gap-6">
                     <CheckCircle2 className="w-5 h-5 text-success" />
                     <div className="space-y-0.5">
                        <span className="font-black text-xs text-primary/70 line-through tracking-tight uppercase">{bug.title}</span>
                        <p className="text-[9px] font-bold text-secondary">{new Date(bug.createdAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <button onClick={() => handleAction(bug.id, 'delete')} className="opacity-0 group-hover:opacity-100 text-secondary hover:text-danger transition-all p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function BugCard({ bug, onResolve, onDelete }: { bug: Bug, onResolve: () => void, onDelete: () => void }) {
  const config = severityConfig[bug.severity];
  const Icon = config.icon;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-secondary/10 overflow-hidden flex transition-all hover:shadow-accent/10 hover:border-accent/20"
    >
      <div className="w-3 shrink-0 relative" style={{ backgroundColor: config.color, boxShadow: `10px 0 30px ${config.color}33` }} />

      <div className="p-10 w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="flex gap-10 items-start flex-1">
            <div 
              className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 border-2 transition-all group-hover:scale-110 shadow-inner"
              style={{ backgroundColor: `${config.color}08`, borderColor: `${config.color}15` }}
            >
              <Icon className="w-10 h-10" style={{ color: config.color }} />
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-black text-primary tracking-tighter uppercase italic leading-none group-hover:text-accent transition-colors">{bug.title}</h3>
              <p className="text-secondary text-sm font-medium leading-relaxed max-w-2xl">{bug.description}</p>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-secondary/50 uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> {new Date(bug.createdAt).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-secondary/50 uppercase tracking-widest">
                  <Fingerprint className="w-3 h-3" /> NODE_{bug.id?.split('-')[0] || 'UNK'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-8 shrink-0 w-full lg:w-auto">
             <div 
              className="px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.3em] border shadow-sm text-white"
              style={{ backgroundColor: config.color, borderColor: `${config.color}44` }}
             >
               {config.label}
             </div>

             <div className="flex items-center gap-4 w-full">
               <button 
                onClick={onResolve}
                className="flex-grow bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-primary transition-all shadow-xl active:scale-95"
               >
                 Mark Resolved
               </button>
               <button onClick={onDelete} className="p-4 text-secondary/30 hover:text-danger hover:bg-danger/5 rounded-2xl transition-all border border-transparent hover:border-danger/10">
                 <Trash2 className="w-6 h-6" />
               </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}