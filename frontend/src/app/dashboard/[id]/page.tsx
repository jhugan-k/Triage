"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { api, logout } from "@/lib/api";
import { 
  AlertCircle, ArrowLeft, CheckCircle2, Trash2, ShieldAlert, 
  Search, LogOut, Moon, Sun, LayoutList, Columns, 
  Activity as ActivityIcon, MessageSquare, Send, TrendingUp, User 
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Bug {
  id: string; 
  title: string; 
  description: string; 
  severity: "High" | "Normal" | "Low"; 
  status: "OPEN" | "RESOLVED"; 
  comments: any[];
}

export default function BugBoard() {
  const { id } = useParams();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [userEmail, setUserEmail] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('triage-theme') === 'dark';
    }
    return false;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeBugId, setActiveBugId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
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
  }, [id]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('triage-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('triage-theme', 'light');
    }
  }, [isDark]);

  const chartData = useMemo(() => {
    const counts = { High: 0, Normal: 0, Low: 0 };
    bugs.forEach(b => counts[b.severity]++);
    return [
      { name: 'High', value: counts.High, color: '#EF4444' },
      { name: 'Normal', value: counts.Normal, color: '#F59E0B' },
      { name: 'Low', value: counts.Low, color: '#3B82F6' },
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

  // Filter and Sort: Open bugs first, then Resolved bugs
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

  if (loading) return <div className="min-h-screen bg-primary flex items-center justify-center text-white font-black">INITIALIZING...</div>;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-[#12181C]' : 'bg-[#ECEFF1]'}`}>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#1A2228]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-secondary hover:text-accent transition-all"><ArrowLeft /></Link>
          <div>
            <h1 className="font-black text-2xl tracking-tighter dark:text-white uppercase leading-none">{dashboard?.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {dashboard?.members.map((m: any) => (
                  <img key={m.id} src={m.avatarUrl} title={m.name} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1A2228]" />
                ))}
              </div>
              <span className="text-[10px] font-black text-secondary dark:text-slate-400 uppercase tracking-widest">
                {dashboard?.members.length} Members Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-xl bg-secondary/10 dark:bg-white/5 text-secondary dark:text-white hover:scale-105 transition-all">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setView(view === 'list' ? 'kanban' : 'list')} className="p-3 rounded-xl bg-secondary/10 dark:bg-white/5 text-secondary dark:text-white hover:scale-105 transition-all">
            {view === 'list' ? <Columns size={18} /> : <LayoutList size={18} />}
          </button>
          <Link href={`/dashboard/${id}/report`} className="bg-accent text-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-accent/20">Report Bug</Link>
          
          <div className="relative ml-2">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-primary dark:bg-accent flex items-center justify-center text-white dark:text-primary hover:scale-105 transition-all shadow-lg"
            >
              <User size={20} />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1A2228] rounded-2xl shadow-2xl p-4 border border-secondary/20 dark:border-white/5 z-[60]">
                <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Authenticated As</p>
                <p className="font-bold text-[#37474F] dark:text-white truncate mb-4">{userEmail}</p>
                <button onClick={logout} className="w-full flex items-center justify-between bg-danger/10 text-danger p-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest">
                  Logout <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1A2228] p-6 rounded-3xl shadow-xl border border-black/5 dark:border-white/5 h-64 flex flex-col items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary dark:text-slate-400 mb-4">Severity Split</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="md:col-span-2 bg-white dark:bg-[#1A2228] p-6 rounded-3xl shadow-xl border border-black/5 dark:border-white/5 h-64">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary dark:text-slate-400 mb-4">Workspace Statistics</h3>
               <div className="grid grid-cols-3 gap-4 h-full pb-8">
                  {[
                    { label: "Total", val: bugs.length, icon: <TrendingUp className="text-info" /> },
                    { label: "Open", val: bugs.filter(b=>b.status==='OPEN').length, icon: <AlertCircle className="text-danger" /> },
                    { label: "High Pri", val: bugs.filter(b=>b.severity==='High').length, icon: <ShieldAlert className="text-warning" /> }
                  ].map((s,i) => (
                    <div key={i} className="bg-background/50 dark:bg-black/20 rounded-2xl p-4 flex flex-col justify-center items-center">
                      {s.icon}
                      <span className="text-3xl font-black mt-2 dark:text-white">{s.val}</span>
                      <span className="text-[9px] font-bold text-secondary dark:text-slate-400 uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input 
                placeholder="Search logs..." 
                className="w-full p-4 pl-12 bg-white dark:bg-[#1A2228] rounded-2xl border-none outline-none dark:text-white shadow-sm focus:ring-2 focus:ring-accent"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="p-4 bg-white dark:bg-[#1A2228] rounded-2xl font-bold text-xs uppercase dark:text-white border-none outline-none"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severity</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {view === 'list' ? (
            <div className="space-y-4">
              {filteredBugs.map(bug => (
                <div key={bug.id} className={`bg-white dark:bg-[#1A2228] p-6 rounded-3xl shadow-sm border-l-4 border-l-accent flex justify-between items-start transition-all hover:shadow-xl ${bug.status === 'RESOLVED' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white uppercase ${bug.severity === 'High' ? 'bg-danger' : bug.severity === 'Normal' ? 'bg-warning' : 'bg-info'}`}>{bug.severity}</span>
                       <h3 className={`font-bold text-lg dark:text-white ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>
                        {bug.title}
                       </h3>
                    </div>
                    <div className={`prose dark:prose-invert text-sm text-secondary dark:text-slate-400 line-clamp-2 ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>
                      <ReactMarkdown>{bug.description}</ReactMarkdown>
                    </div>
                    <button onClick={() => setActiveBugId(activeBugId === bug.id ? null : bug.id)} className="mt-4 flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest">
                      <MessageSquare size={14} /> {bug.comments.length} Comments
                    </button>
                    {activeBugId === bug.id && (
                      <div className="mt-4 p-4 bg-background/50 dark:bg-black/20 rounded-2xl space-y-4">
                        {bug.comments.map((c: any) => (
                          <div key={c.id} className="flex gap-3 items-start">
                            <img src={c.user.avatarUrl} className="w-6 h-6 rounded-full" />
                            <div>
                              <p className="text-xs font-black dark:text-white">{c.user.name}</p>
                              <p className="text-xs text-secondary dark:text-slate-400">{c.text}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input className="flex-1 bg-white dark:bg-[#1A2228] p-2 rounded-xl text-xs outline-none dark:text-white" placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                          <button onClick={() => handleAddComment(bug.id)} className="p-2 bg-accent rounded-xl text-primary"><Send size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {bug.status === 'OPEN' && (
                      <button 
                        onClick={() => handleResolve(bug.id)} 
                        className="p-3 bg-success/10 text-success rounded-xl hover:bg-success hover:text-white transition-all"
                        title="Resolve Bug"
                      >
                        <CheckCircle2 size={20}/>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteBug(bug.id)}
                      className="p-3 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-all"
                      title="Delete Incident"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {['High', 'Normal', 'Low'].map(sev => (
                <div key={sev} className="kanban-column">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-center opacity-50 dark:text-white">{sev} Priority</h4>
                  <div className="space-y-4">
                    {filteredBugs.filter(b => b.severity === sev).map(bug => (
                      <div key={bug.id} className={`bg-white dark:bg-[#1A2228] p-4 rounded-2xl shadow-sm cursor-pointer hover:scale-[1.02] transition-all ${bug.status === 'RESOLVED' ? 'opacity-40 grayscale' : ''}`}>
                        <p className={`font-bold text-sm mb-2 dark:text-white ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>{bug.title}</p>
                        <p className={`text-[10px] text-secondary dark:text-slate-400 line-clamp-1 ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>{bug.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-24 bg-white dark:bg-[#1A2228] rounded-3xl p-6 shadow-xl border border-black/5 dark:border-white/5">
             <div className="flex items-center gap-2 mb-6">
                <ActivityIcon className="text-accent" size={18} />
                <h3 className="font-black text-sm uppercase tracking-widest dark:text-white">Live Activity</h3>
             </div>
             <div className="space-y-6">
                {dashboard?.activities.map((act: any) => (
                  <div key={act.id} className="relative pl-6 border-l-2 border-accent/20">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 bg-accent rounded-full" />
                    <p className="text-[11px] font-medium text-secondary dark:text-slate-300 leading-tight">{act.text}</p>
                    <span className="text-[8px] font-black uppercase text-secondary/50 dark:text-slate-500 mt-1 inline-block">
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}