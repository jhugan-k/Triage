"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { api, logout } from "@/lib/api";
import {
  AlertCircle, ArrowLeft, CheckCircle2, Trash2, ShieldAlert,
  Search, LogOut, LayoutList, Columns,
  Activity as ActivityIcon, MessageSquare, Send, TrendingUp, User,
  Ghost, Sparkles
} from "lucide-react";
import Link from "next/link";
import { DEMO_BUGS, DEMO_DASHBOARD, DEMO_ID } from "@/lib/demo";
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from "framer-motion";

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Normal" | "Low";
  status: "OPEN" | "RESOLVED";
  comments: any[];
}

const SEVERITY_COLOR: Record<Bug["severity"], string> = {
  High: "#ff5f6b",
  Normal: "#ffb224",
  Low: "#6699ff",
};

const SEVERITY_BADGE: Record<Bug["severity"], string> = {
  High: "bg-danger/15 text-danger border-danger/30",
  Normal: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-accent/15 text-accent-bright border-accent/30",
};

export default function BugBoard() {
  const { id } = useParams();
  // The sample workspace is a static display case: no API, no mutations.
  const isDemo = id === DEMO_ID;
  const [bugs, setBugs] = useState<Bug[]>(isDemo ? DEMO_BUGS : []);
  const [dashboard, setDashboard] = useState<any>(isDemo ? DEMO_DASHBOARD : null);
  const [loading, setLoading] = useState(!isDemo);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [userEmail, setUserEmail] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeBugId, setActiveBugId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (isDemo) return; // seeded from useState initializers; never hits the API
    async function loadData() {
      try {
        const [bugRes, dashRes] = await Promise.all([
          api.get<Bug[]>(`/dashboards/${id}/bugs`),
          api.get<any>(`/dashboards/${id}`)
        ]);
        setBugs(bugRes.data);
        setDashboard(dashRes.data);
        const token = localStorage.getItem('token');
        if (token) setUserEmail(JSON.parse(atob(token.split('.')[1])).email);
        setLoading(false);
      } catch (err) { setLoading(false); }
    }
    loadData();
  }, [id, isDemo]);

  const chartData = useMemo(() => {
    const counts = { High: 0, Normal: 0, Low: 0 };
    bugs.forEach(b => counts[b.severity]++);
    return [
      { name: 'High', value: counts.High, color: SEVERITY_COLOR.High },
      { name: 'Normal', value: counts.Normal, color: SEVERITY_COLOR.Normal },
      { name: 'Low', value: counts.Low, color: SEVERITY_COLOR.Low },
    ];
  }, [bugs]);

  const handleResolve = async (bugId: string) => {
    await api.patch(`/bugs/${bugId}/resolve`);
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: "RESOLVED" } : b));
  };

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm("Delete this incident log permanently?")) return;
    try {
      await api.delete(`/bugs/${bugId}`);
      setBugs(prev => prev.filter(b => b.id !== bugId));
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const handleAddComment = async (bugId: string) => {
    if (!commentText.trim()) return;
    const res = await api.post(`/bugs/${bugId}/comments`, { text: commentText });
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, comments: [...b.comments, res.data] } : b));
    setCommentText("");
  };

  const filteredBugs = useMemo(() => {
    return bugs
      .filter(bug =>
        bug.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (severityFilter === "all" || bug.severity === severityFilter)
      )
      .sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "OPEN" ? -1 : 1;
      });
  }, [bugs, searchQuery, severityFilter]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col gap-4 items-center justify-center text-secondary">
      <div className="w-10 h-10 rounded-full border-2 border-line border-t-accent-bright animate-spin" />
      <span className="font-black text-[10px] uppercase tracking-[0.4em]">Initialising Link</span>
    </div>
  );

  return (
    <div className="atmosphere grid-field min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-surface/70 backdrop-blur-xl border-b border-line px-4 sm:px-8 py-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link href="/dashboard" aria-label="Back to workspaces" className="text-muted hover:text-accent-bright transition-colors shrink-0"><ArrowLeft aria-hidden="true" /></Link>
          <div className="min-w-0">
            <h1 className="font-black text-xl sm:text-2xl tracking-tighter text-primary uppercase leading-none truncate">{dashboard?.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {dashboard?.members.map((m: any) => (
                  <img key={m.id} src={m.avatarUrl} alt={m.name} title={m.name} className="w-6 h-6 rounded-full border-2 border-surface bg-surface-2" />
                ))}
              </div>
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest whitespace-nowrap">
                {dashboard?.members.length} Members Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setView(view === 'list' ? 'kanban' : 'list')}
            aria-label={view === 'list' ? "Switch to board view" : "Switch to list view"}
            className="p-3 rounded-xl bg-white/5 border border-line text-secondary hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
          >
            {view === 'list' ? <Columns size={18} aria-hidden="true" /> : <LayoutList size={18} aria-hidden="true" />}
          </button>
          {isDemo ? (
            <span className="px-4 sm:px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-accent/10 text-accent-bright border border-accent/30">
              Sample <span className="hidden sm:inline">&middot; Read Only</span>
            </span>
          ) : (
            <Link href={`/dashboard/${id}/report`} className="bg-accent-deep text-white px-4 sm:px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_-8px_rgba(26,102,255,0.8)] hover:bg-accent transition-colors">Report <span className="hidden sm:inline">Bug</span></Link>
          )}

          <div className="relative ml-1">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Account menu"
              aria-expanded={isProfileOpen}
              className="w-10 h-10 rounded-full bg-white/5 border border-line-strong flex items-center justify-center text-secondary hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
            >
              <User size={20} aria-hidden="true" />
            </button>
            {isProfileOpen && (
              <div className="panel absolute right-0 mt-3 w-64 bg-surface rounded-2xl shadow-2xl p-4 z-60">
                <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Authenticated As</p>
                <p className="font-bold text-primary truncate mb-4">{userEmail}</p>
                <button onClick={logout} className="w-full flex items-center justify-between bg-danger/10 text-danger p-3 rounded-xl hover:bg-danger/20 transition-colors font-black text-xs uppercase tracking-widest cursor-pointer">Logout <LogOut size={16} aria-hidden="true" /></button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 grid grid-cols-12 gap-6 lg:gap-8 relative z-10">
        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="panel p-6 rounded-3xl h-64 flex flex-col items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">Severity Split</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#10151f', border: '1px solid rgba(102,153,255,0.28)', borderRadius: '0.75rem', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="panel md:col-span-2 p-6 rounded-3xl h-64">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">Workspace Statistics</h3>
               <div className="grid grid-cols-3 gap-4 h-full pb-8">
                  {[
                    { label: "Total", val: bugs.length, icon: <TrendingUp className="text-accent-bright" aria-hidden="true" /> },
                    { label: "Open", val: bugs.filter(b=>b.status==='OPEN').length, icon: <AlertCircle className="text-danger" aria-hidden="true" /> },
                    { label: "High Pri", val: bugs.filter(b=>b.severity==='High').length, icon: <ShieldAlert className="text-warning" aria-hidden="true" /> }
                  ].map((s,i) => (
                    <div key={i} className="bg-black/40 border border-line rounded-2xl p-4 flex flex-col justify-center items-center">
                      {s.icon}
                      <span className="text-3xl font-black mt-2 text-primary">{s.val}</span>
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <label htmlFor="search" className="sr-only">Search logs</label>
              <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                id="search"
                placeholder="Search logs..."
                className="w-full p-4 pl-12 bg-surface border border-line rounded-2xl outline-none text-primary focus:border-accent transition-colors"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <label htmlFor="severity" className="sr-only">Filter by severity</label>
            <select
              id="severity"
              className="p-4 bg-surface border border-line rounded-2xl font-bold text-xs uppercase text-primary outline-none focus:border-accent transition-colors cursor-pointer"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severity</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {bugs.length === 0 ? (
            /* EMPTY STATE */
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 select-none text-center"
            >
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-accent/20 blur-[60px] rounded-full" />
                  <Ghost size={120} className="relative text-muted/25 animate-[bounce_2s_infinite]" aria-hidden="true" />
                  <div className="absolute -bottom-2 w-full h-1 bg-accent/20 rounded-full blur-[2px]" />
               </div>
               <h3 className="text-3xl sm:text-4xl font-black text-primary/40 tracking-tighter uppercase">No bugs yet?</h3>
               <p className="text-[10px] font-black text-muted/60 uppercase tracking-[0.4em] mt-2">
                 Report some to initialize triage engine
               </p>
               <Link href={`/dashboard/${id}/report`} className="mt-8 flex items-center gap-2 text-accent-bright font-black text-[10px] uppercase tracking-widest hover:text-accent-soft transition-colors">
                 <Sparkles size={14} aria-hidden="true" /> Report First Incident
               </Link>
            </motion.div>
          ) : (
            view === 'list' ? (
              <div className="space-y-4">
                {filteredBugs.map(bug => (
                  <div
                    key={bug.id}
                    style={{ borderLeftColor: SEVERITY_COLOR[bug.severity] }}
                    className={`panel p-6 rounded-3xl border-l-4 flex justify-between items-start gap-4 transition-colors hover:border-line-strong ${bug.status === 'RESOLVED' ? 'opacity-45' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${SEVERITY_BADGE[bug.severity]}`}>{bug.severity}</span>
                         {bug.status === 'RESOLVED' && (
                           <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-success/15 text-success border-success/30">Resolved</span>
                         )}
                         <h3 className={`font-bold text-lg text-primary ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>
                          {bug.title}
                         </h3>
                      </div>
                      <div className={`prose prose-invert prose-sm max-w-none text-sm text-muted line-clamp-2 ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>
                        <ReactMarkdown>{bug.description}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => setActiveBugId(activeBugId === bug.id ? null : bug.id)}
                        aria-expanded={activeBugId === bug.id}
                        className="mt-4 flex items-center gap-2 text-[10px] font-bold text-accent-bright uppercase tracking-widest hover:text-accent-soft transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} aria-hidden="true" /> {bug.comments.length} Comments
                      </button>
                      {activeBugId === bug.id && (
                        <div className="mt-4 p-4 bg-black/40 border border-line rounded-2xl space-y-4">
                          {bug.comments.map((c: any) => (
                            <div key={c.id} className="flex gap-3 items-start">
                              <img src={c.user.avatarUrl} alt="" className="w-6 h-6 rounded-full bg-surface-2" />
                              <div>
                                <p className="text-xs font-black text-primary">{c.user.name}</p>
                                <p className="text-xs text-muted">{c.text}</p>
                              </div>
                            </div>
                          ))}
                          {isDemo ? (
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted/70">
                              Commenting is disabled in the sample workspace
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              <label htmlFor={`comment-${bug.id}`} className="sr-only">Add comment</label>
                              <input
                                id={`comment-${bug.id}`}
                                className="flex-1 bg-surface-2 border border-line p-2 rounded-xl text-xs outline-none text-primary focus:border-accent transition-colors"
                                placeholder="Add comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                              />
                              <button onClick={() => handleAddComment(bug.id)} aria-label="Send comment" className="p-2 bg-accent-deep rounded-xl text-white hover:bg-accent transition-colors cursor-pointer"><Send size={14} aria-hidden="true" /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!isDemo && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {bug.status === 'OPEN' && (
                          <button onClick={() => handleResolve(bug.id)} aria-label={`Resolve ${bug.title}`} className="p-3 bg-success/10 text-success rounded-xl hover:bg-success hover:text-black transition-colors cursor-pointer"><CheckCircle2 size={20} aria-hidden="true" /></button>
                        )}
                        <button onClick={() => handleDeleteBug(bug.id)} aria-label={`Delete ${bug.title}`} className="p-3 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-colors cursor-pointer"><Trash2 size={20} aria-hidden="true" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['High', 'Normal', 'Low'] as const).map(sev => (
                  <div key={sev} className="kanban-column">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR[sev] }} />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">{sev} Priority</h4>
                      <span className="text-[10px] font-black text-muted">{filteredBugs.filter(b => b.severity === sev).length}</span>
                    </div>
                    <div className="space-y-4">
                      {filteredBugs.filter(b => b.severity === sev).map(bug => (
                        <div key={bug.id} className={`bg-surface-2 border border-line p-4 rounded-2xl hover:border-line-strong transition-colors ${bug.status === 'RESOLVED' ? 'opacity-45' : ''}`}>
                          <p className={`font-bold text-sm mb-2 text-primary ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>{bug.title}</p>
                          <p className={`text-[10px] text-muted line-clamp-1 ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>{bug.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="panel sticky top-24 rounded-3xl p-6">
             <div className="flex items-center gap-2 mb-6">
                <ActivityIcon className="text-accent-bright" size={18} aria-hidden="true" />
                <h3 className="font-black text-sm uppercase tracking-widest text-primary">Live Activity</h3>
                <span className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
             </div>
             <div className="space-y-6">
                {dashboard?.activities.map((act: any) => (
                  <div key={act.id} className="relative pl-6 border-l-2 border-accent/25">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 bg-accent-bright rounded-full" />
                    <p className="text-[11px] font-medium text-muted leading-tight">{act.text}</p>
                    <span className="text-[8px] font-black uppercase text-secondary/60 mt-1 inline-block">{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
