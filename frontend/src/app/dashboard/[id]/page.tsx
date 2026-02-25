"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
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
  
  const resolvedBugs = useMemo(() => bugs.filter(b => b.status === 'RESOLVED'), [bugs]);

  const handleAction = async (bugId: string, action: 'resolve' | 'delete') => {
    try {
      if (action === 'resolve') {
        await api.patch(`/bugs/${bugId}/resolve`);
        setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: 'RESOLVED' } : b));
      } else {
        if (!confirm("Confirm purge?")) return;
        await api.delete(`/bugs/${bugId}`);
        setBugs(prev => prev.filter(b => b.id !== bugId));
      }
    } catch (err) { alert("Action failed"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black tracking-tighter opacity-10 text-6xl">SYNCING...</div>;

  return (
    <div className="min-h-screen pb-24">
      {/* HEADER WITH LOGOUT */}
      <header className="sticky top-0 z-50 bg-[#25343F]/95 backdrop-blur-xl border-b border-white/5 px-10 py-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="bg-white/5 p-3 rounded-2xl text-[#BFC9D1] hover:text-[#FF9B51] transition-all">
              <ArrowLeft />
            </Link>
            <div className="space-y-1">
              <h1 className="text-white font-black text-4xl tracking-tighter uppercase italic">{dashboard?.name}</h1>
              <div className="flex items-center gap-3 text-[10px] font-black text-[#FF9B51] tracking-[0.4em]">
                <Activity className="w-3 h-3 animate-pulse" /> LIVE_MONITORING
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-64 hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BFC9D1]/40" />
              <input placeholder="Search..." className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white text-xs font-bold outline-none" onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* LOGOUT BUTTON */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[#BFC9D1] hover:text-white hover:bg-white/5 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>

            <Link href={`/dashboard/${id}/report`} className="bg-[#FF9B51] text-[#25343F] px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> New Log
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* ... Rest of your stats and bug list mapping ... */}
        <section className="space-y-8">
           {activeBugs.map((bug) => (
             <BugCard key={bug.id} bug={bug} onResolve={() => handleAction(bug.id, 'resolve')} onDelete={() => handleAction(bug.id, 'delete')} />
           ))}
        </section>
      </main>
    </div>
  );
}

// ... BugCard function remains the same ...
function BugCard({ bug, onResolve, onDelete }: { bug: Bug, onResolve: () => void, onDelete: () => void }) {
  const config = severityConfig[bug.severity];
  const Icon = config.icon;
  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="group relative bg-white rounded-[2.5rem] shadow-2xl border border-[#BFC9D1]/10 overflow-hidden flex transition-all">
      <div className="w-3 shrink-0" style={{ backgroundColor: config.color }} />
      <div className="p-10 w-full flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex gap-10 items-start flex-1">
            <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center border-2" style={{ backgroundColor: `${config.color}08`, borderColor: `${config.color}15` }}>
              <Icon className="w-10 h-10" style={{ color: config.color }} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-[#25343F] tracking-tighter uppercase italic leading-none">{bug.title}</h3>
              <p className="text-[#BFC9D1] text-sm font-medium leading-relaxed max-w-2xl">{bug.description}</p>
              <div className="flex items-center gap-4 text-[9px] font-black text-[#BFC9D1]/50 tracking-widest uppercase">
                <Clock className="w-3 h-3" /> {new Date(bug.createdAt).toLocaleTimeString()} <Fingerprint className="w-3 h-3 ml-4" /> NODE_{bug.id?.toString().slice(0,5)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={onResolve} className="bg-[#25343F] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FF9B51] hover:text-[#25343F] transition-all shadow-xl">Mark Resolved</button>
             <button onClick={onDelete} className="p-4 text-[#BFC9D1]/30 hover:text-red-500 transition-all"><Trash2 className="w-6 h-6" /></button>
          </div>
      </div>
    </motion.div>
  );
}