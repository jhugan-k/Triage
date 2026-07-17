"use client";
import { useEffect, useState } from "react";
import { api, logout } from "@/lib/api";
import { Plus, LayoutDashboard, Key, ArrowRight, Activity, LogOut, X, User, Ghost, Box, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DEMO_BUGS, DEMO_DASHBOARD, DEMO_ID, type DemoBug } from "@/lib/demo";

interface Dashboard {
  id: string; name: string; accessKey: string;
}

const SEVERITY_DOT: Record<DemoBug["severity"], string> = {
  High: "bg-danger",
  Normal: "bg-warning",
  Low: "bg-accent-bright",
};

/** Read-only showcase every user sees. Static data — no API, nothing to corrupt. */
function SampleWorkspaceCard() {
  const counts = DEMO_BUGS.reduce((acc, b) => {
    acc[b.severity]++;
    return acc;
  }, { High: 0, Normal: 0, Low: 0 } as Record<DemoBug["severity"], number>);

  return (
    <Link
      href={`/dashboard/${DEMO_ID}`}
      className="panel group rounded-[2rem] p-6 sm:p-8 hover:border-line-strong hover:shadow-[0_30px_70px_-25px_rgba(26,102,255,0.6)] transition-colors duration-200 block"
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-accent/10 border border-line w-11 h-11 rounded-2xl flex items-center justify-center text-accent-bright group-hover:bg-accent-deep group-hover:text-white transition-colors shrink-0">
            <Box size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-primary tracking-tighter truncate">{DEMO_DASHBOARD.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">{DEMO_BUGS.length} sample incidents</p>
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-accent/10 text-accent-bright border border-accent/30 shrink-0">
          Read Only
        </span>
      </div>

      {/* Severity mix */}
      <div className="flex items-center gap-4 mb-5">
        {(Object.keys(counts) as DemoBug["severity"][]).map(sev => (
          <div key={sev} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{counts[sev]} {sev}</span>
          </div>
        ))}
      </div>

      {/* Bug preview */}
      <ul className="space-y-2 mb-6">
        {DEMO_BUGS.slice(0, 4).map(bug => (
          <li key={bug.id} className="flex items-center gap-3 bg-black/40 border border-line rounded-xl px-3 py-2.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[bug.severity]}`} aria-hidden="true" />
            <span className={`text-xs font-bold text-secondary truncate ${bug.status === 'RESOLVED' ? 'line-through opacity-50' : ''}`}>
              {bug.title}
            </span>
          </li>
        ))}
        <li className="text-[10px] font-black uppercase tracking-widest text-muted/60 pl-3 pt-1">
          + {DEMO_BUGS.length - 4} more
        </li>
      </ul>

      <div className="flex items-center justify-between gap-2 bg-white/5 border border-line px-4 py-3 rounded-xl text-secondary group-hover:bg-accent-deep group-hover:text-white group-hover:border-transparent transition-colors">
        <span className="text-xs font-black uppercase tracking-widest">Explore the Sample</span>
        <ArrowRight size={20} aria-hidden="true" />
      </div>
    </Link>
  );
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

  if (loading) return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-background text-secondary">
      <div className="w-10 h-10 rounded-full border-2 border-line border-t-accent-bright animate-spin" />
      <span className="font-black text-[10px] uppercase tracking-[0.4em]">Syncing</span>
    </div>
  );

  return (
    <div className="atmosphere grid-field min-h-screen bg-background relative flex flex-col">

      <nav className="bg-surface/70 backdrop-blur-xl border-b border-line px-4 sm:px-6 py-5 relative z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard aria-hidden="true" className="text-accent-bright w-7 h-7" />
            <h1 className="text-primary font-black text-2xl sm:text-3xl tracking-tighter">TRIAGE</h1>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => setIsJoinModalOpen(true)}
               className="bg-white/5 text-secondary px-4 sm:px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-primary transition-colors border border-line cursor-pointer"
             >
               Join <span className="hidden sm:inline">Workspace</span>
             </button>
             <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-label="Account menu"
                  aria-expanded={isProfileOpen}
                  className="w-12 h-12 rounded-full bg-accent-deep flex items-center justify-center text-white glow-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  <User size={22} aria-hidden="true" />
                </button>
                {isProfileOpen && (
                  <div className="panel absolute right-0 mt-4 w-64 rounded-2xl shadow-2xl p-4 z-50">
                    <p className="text-[10px] font-black uppercase text-secondary mb-1 tracking-widest">Operator Email</p>
                    <p className="font-bold text-primary truncate mb-4">{userEmail}</p>
                    <button onClick={logout} className="w-full flex items-center justify-between bg-danger/10 text-danger p-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-danger/20 transition-colors cursor-pointer">
                      Terminate <LogOut size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 flex flex-col relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <Activity aria-hidden="true" className="text-accent-bright w-4 h-4" />
          <h2 className="text-secondary text-[10px] font-black uppercase tracking-[0.3em]">Neural Workspaces</h2>
          <div className="flex-1 h-px bg-linear-to-r from-line to-transparent" />
        </div>

        {dashboards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pb-20"
          >
            {/* Left: empty-state copy */}
            <div className="flex flex-col items-start text-left">
              <div className="relative mb-8">
                 <div className="absolute inset-0 bg-accent/25 blur-[60px] rounded-full" />
                 <div className="panel relative p-8 rounded-[2.5rem]">
                   <Ghost size={64} className="text-muted/40" aria-hidden="true" />
                 </div>
                 <div className="absolute -top-2 -right-2 bg-accent-deep p-3 rounded-2xl glow-sm animate-bounce">
                   <Sparkles size={20} className="text-white" aria-hidden="true" />
                 </div>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-primary tracking-tighter mb-4">No Active Links Found</h3>
              <p className="text-muted max-w-sm font-medium text-lg mb-10">
                You haven&apos;t established any project workspaces yet. Create a new link or use an access key to join an existing one.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard/new" className="bg-accent-deep text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_18px_50px_-12px_rgba(26,102,255,0.7)] hover:bg-accent transition-colors text-center">Initialize New Project</Link>
                <button onClick={() => setIsJoinModalOpen(true)} className="bg-white/5 text-secondary border border-line-strong px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/10 hover:text-primary transition-colors cursor-pointer">Enter Access Key</button>
              </div>
            </div>

            {/* Right: shared read-only sample workspace */}
            <SampleWorkspaceCard />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {dashboards.map((db) => (
              <Link
                key={db.id}
                href={`/dashboard/${db.id}`}
                className="panel group rounded-[2rem] p-8 lg:p-10 hover:border-line-strong hover:shadow-[0_30px_70px_-25px_rgba(26,102,255,0.6)] transition-colors duration-200"
              >
                <div className="bg-accent/10 border border-line w-14 h-14 rounded-2xl flex items-center justify-center mb-8 text-accent-bright group-hover:bg-accent-deep group-hover:text-white transition-colors">
                   <Box size={28} aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black text-primary tracking-tighter mb-2">{db.name}</h3>
                <div className="flex items-center gap-2 text-muted font-mono text-xs font-bold uppercase tracking-widest">
                  <Key size={14} aria-hidden="true" /> {db.accessKey}
                </div>
                <div className="mt-10 flex justify-end">
                  <div className="flex items-center gap-2 bg-white/5 border border-line px-4 py-3 rounded-xl text-secondary group-hover:bg-accent-deep group-hover:text-white group-hover:border-transparent transition-colors">
                    <span className="text-xs font-black uppercase tracking-widest">Go to Dashboard</span>
                    <ArrowRight size={20} aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button only if dashboards exist */}
      {dashboards.length > 0 && (
        <Link href="/dashboard/new" className="fixed bottom-8 right-8 bg-accent-deep text-white px-6 py-4 rounded-full shadow-[0_20px_50px_rgba(26,102,255,0.5)] hover:bg-accent transition-colors z-50 flex items-center gap-3">
          <span className="font-black uppercase tracking-widest text-sm hidden sm:inline">Create New Project</span>
          <Plus size={24} strokeWidth={3} aria-hidden="true" />
          <span className="sr-only sm:hidden">Create New Project</span>
        </Link>
      )}

      {/* Join Modal */}
      {isJoinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-title"
          className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
          <div className="panel bg-surface rounded-[2.5rem] p-8 sm:p-12 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsJoinModalOpen(false)} aria-label="Close dialog" className="absolute top-8 right-8 text-muted hover:text-primary transition-colors cursor-pointer"><X aria-hidden="true" /></button>
            <h2 id="join-title" className="text-3xl font-black text-primary mb-2">Access Key</h2>
            <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-10">Enter workspace link ID</p>
            <form onSubmit={handleJoinProject} className="space-y-6">
              <label htmlFor="access-key" className="sr-only">Access key</label>
              <input
                id="access-key"
                className="w-full p-6 rounded-2xl border border-line bg-black/50 text-primary focus:border-accent outline-none font-black text-center text-3xl tracking-[0.4em] uppercase"
                value={accessKeyInput} onChange={(e) => setAccessKeyInput(e.target.value.toUpperCase())} placeholder="000000"
              />
              <button disabled={joinLoading} className="w-full bg-accent-deep text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {joinLoading ? "Linking..." : "Establish Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
