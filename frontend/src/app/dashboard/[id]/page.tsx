"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, logout } from "@/lib/api";
import { AlertCircle, ArrowLeft, CheckCircle2, Ghost, Trash2, ShieldAlert, Filter, Search, X, LogOut } from "lucide-react";
import Link from "next/link";

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Normal" | "Low";
  status: "OPEN" | "RESOLVED";
}

interface Dashboard {
  name: string;
  accessKey: string;
}

export default function BugBoard() {
  const { id } = useParams();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [bugRes, dashRes] = await Promise.all([
          api.get<Bug[]>(`/dashboards/${id}/bugs`),
          api.get<Dashboard>(`/dashboards/${id}`)
        ]);

        if (isMounted) {
          setBugs(bugRes.data);
          setDashboard(dashRes.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [id]);

  const handleResolve = async (bugId: string) => {
    try {
      await api.patch(`/bugs/${bugId}/resolve`);
      setBugs((prev) => prev.map((b) => (b.id === bugId ? { ...b, status: "RESOLVED" } : b)));
    } catch (err) { alert("Resolution failed"); }
  };

  const handleDelete = async (bugId: string) => {
    if (!confirm("Execute permanent deletion?")) return;
    try {
      await api.delete(`/bugs/${bugId}`);
      setBugs((prev) => prev.filter((b) => b.id !== bugId));
    } catch (err) { alert("Delete failed"); }
  };

  const handleLogout = () => {
    if (confirm("Terminate session and return to login?")) {
      logout();
    }
  };

  const getSevTheme = (s: string) => {
    switch (s) {
      case "High": return {
        bg: "bg-gradient-to-br from-[#FF5252] to-[#E91E63]",
        text: "text-[#FF5252]",
        border: "border-[#FF5252]/30",
        glow: "shadow-[#FF5252]/20",
        lightBg: "bg-[#FF5252]/10"
      };
      case "Normal": return {
        bg: "bg-gradient-to-br from-[#FFD740] to-[#FFA726]",
        text: "text-[#FFA726]",
        border: "border-[#FFD740]/30",
        glow: "shadow-[#FFD740]/20",
        lightBg: "bg-[#FFD740]/10"
      };
      case "Low": return {
        bg: "bg-gradient-to-br from-[#81D4FA] to-[#4FC3F7]",
        text: "text-[#4FC3F7]",
        border: "border-[#81D4FA]/30",
        glow: "shadow-[#81D4FA]/20",
        lightBg: "bg-[#81D4FA]/10"
      };
      default: return {
        bg: "bg-gradient-to-br from-secondary to-secondary/70",
        text: "text-secondary",
        border: "border-secondary/30",
        glow: "shadow-secondary/20",
        lightBg: "bg-secondary/10"
      };
    }
  };

  // Filter and search logic
  const filteredBugs = bugs.filter((bug) => {
    const matchesSearch = bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bug.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || bug.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Statistics
  const stats = {
    total: bugs.length,
    open: bugs.filter(b => b.status === "OPEN").length,
    resolved: bugs.filter(b => b.status === "RESOLVED").length,
    high: bugs.filter(b => b.severity === "High" && b.status === "OPEN").length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#37474F] via-[#455A64] to-[#546E7A] relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#FF6E40]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#4FC3F7]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className="w-12 h-12 border-4 border-[#FF6E40] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-white tracking-[0.2em] text-sm uppercase">Loading Neural Link...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Animated Background with Tech Shapes */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#ECEFF1] via-[#CFD8DC] to-[#B0BEC5]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#FF6E40]/10 to-[#FF5252]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-[#4FC3F7]/10 to-[#81D4FA]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#66BB6A]/10 to-[#4CAF50]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>

        {/* Circuit board patterns */}
        <div className="absolute top-20 left-[15%] opacity-10">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="20" cy="20" r="8" fill="#FF6E40" />
            <circle cx="100" cy="20" r="8" fill="#FF6E40" />
            <circle cx="20" cy="100" r="8" fill="#FF6E40" />
            <circle cx="100" cy="100" r="8" fill="#FF6E40" />
            <line x1="20" y1="20" x2="100" y2="20" stroke="#FF6E40" strokeWidth="3" />
            <line x1="20" y1="100" x2="100" y2="100" stroke="#FF6E40" strokeWidth="3" />
            <line x1="20" y1="20" x2="20" y2="100" stroke="#FF6E40" strokeWidth="3" />
            <line x1="100" y1="20" x2="100" y2="100" stroke="#FF6E40" strokeWidth="3" />
            <circle cx="60" cy="60" r="12" fill="#FF6E40" />
            <line x1="20" y1="20" x2="60" y2="60" stroke="#FF6E40" strokeWidth="2" />
            <line x1="100" y1="20" x2="60" y2="60" stroke="#FF6E40" strokeWidth="2" />
            <line x1="20" y1="100" x2="60" y2="60" stroke="#FF6E40" strokeWidth="2" />
            <line x1="100" y1="100" x2="60" y2="60" stroke="#FF6E40" strokeWidth="2" />
          </svg>
        </div>

        <div className="absolute bottom-32 right-[20%] opacity-10 animate-pulse" style={{ animationDuration: '7s' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="#4FC3F7" strokeWidth="3" strokeDasharray="10 5" />
            <circle cx="50" cy="50" r="25" stroke="#4FC3F7" strokeWidth="3" />
            <circle cx="50" cy="50" r="10" fill="#4FC3F7" />
            <line x1="50" y1="10" x2="50" y2="25" stroke="#4FC3F7" strokeWidth="3" />
            <line x1="50" y1="75" x2="50" y2="90" stroke="#4FC3F7" strokeWidth="3" />
            <line x1="10" y1="50" x2="25" y2="50" stroke="#4FC3F7" strokeWidth="3" />
            <line x1="75" y1="50" x2="90" y2="50" stroke="#4FC3F7" strokeWidth="3" />
          </svg>
        </div>

        <div className="absolute top-1/3 right-[10%] opacity-5 font-mono text-[#37474F] text-xs rotate-12 animate-pulse" style={{ animationDuration: '10s' }}>
          <div>01001000 01100101</div>
          <div>01101100 01101100</div>
          <div>01101111 00100000</div>
          <div>01010111 01101111</div>
        </div>

        <div className="absolute bottom-1/4 left-[12%] opacity-5 font-mono text-[#37474F] text-xs -rotate-6 animate-pulse" style={{ animationDuration: '11s', animationDelay: '2s' }}>
          <div>11010010 10101100</div>
          <div>00110101 11001010</div>
          <div>10011100 01010111</div>
        </div>

        <div className="absolute top-40 right-[30%] opacity-8">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M40 5 L70 20 L70 50 L40 65 L10 50 L10 20 Z" stroke="#66BB6A" strokeWidth="2.5" fill="none" />
            <path d="M40 20 L55 27.5 L55 42.5 L40 50 L25 42.5 L25 27.5 Z" stroke="#66BB6A" strokeWidth="2" fill="none" />
            <circle cx="40" cy="35" r="5" fill="#66BB6A" />
          </svg>
        </div>

        <div className="absolute bottom-1/3 left-[25%] opacity-8 animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M30 5 L50 15 L50 35 L30 45 L10 35 L10 15 Z" stroke="#FFD740" strokeWidth="2" fill="none" />
            <circle cx="30" cy="25" r="3" fill="#FFD740" />
          </svg>
        </div>

        <div className="absolute top-[15%] left-[40%] opacity-6">
          <svg width="200" height="100" viewBox="0 0 200 100" fill="none">
            <path d="M0 50 Q50 20, 100 50 T200 50" stroke="#FF6E40" strokeWidth="2" strokeDasharray="5 5" fill="none" />
            <circle cx="0" cy="50" r="4" fill="#FF6E40" />
            <circle cx="100" cy="50" r="4" fill="#FF6E40" />
            <circle cx="200" cy="50" r="4" fill="#FF6E40" />
          </svg>
        </div>

        <div className="absolute bottom-[20%] right-[15%] opacity-6 animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }}>
          <svg width="150" height="80" viewBox="0 0 150 80" fill="none">
            <path d="M0 40 L50 10 L100 40 L150 10" stroke="#4FC3F7" strokeWidth="2" strokeDasharray="8 4" fill="none" />
            <circle cx="50" cy="10" r="4" fill="#4FC3F7" />
            <circle cx="100" cy="40" r="4" fill="#4FC3F7" />
          </svg>
        </div>

        <div className="absolute top-[60%] left-[8%] opacity-7">
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <rect x="20" y="20" width="30" height="30" stroke="#546E7A" strokeWidth="2.5" fill="none" />
            <rect x="25" y="25" width="20" height="20" fill="#546E7A" opacity="0.3" />
            <line x1="15" y1="25" x2="20" y2="25" stroke="#546E7A" strokeWidth="2" />
            <line x1="15" y1="35" x2="20" y2="35" stroke="#546E7A" strokeWidth="2" />
            <line x1="15" y1="45" x2="20" y2="45" stroke="#546E7A" strokeWidth="2" />
            <line x1="50" y1="25" x2="55" y2="25" stroke="#546E7A" strokeWidth="2" />
            <line x1="50" y1="35" x2="55" y2="35" stroke="#546E7A" strokeWidth="2" />
            <line x1="50" y1="45" x2="55" y2="45" stroke="#546E7A" strokeWidth="2" />
          </svg>
        </div>

        <div className="absolute top-[45%] right-[35%] opacity-7 animate-pulse" style={{ animationDuration: '6s' }}>
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <circle cx="45" cy="20" r="6" fill="#FF6E40" />
            <circle cx="20" cy="70" r="6" fill="#4FC3F7" />
            <circle cx="70" cy="70" r="6" fill="#66BB6A" />
            <line x1="45" y1="26" x2="20" y2="64" stroke="#546E7A" strokeWidth="2" opacity="0.5" />
            <line x1="45" y1="26" x2="70" y2="64" stroke="#546E7A" strokeWidth="2" opacity="0.5" />
            <line x1="26" y1="70" x2="64" y2="70" stroke="#546E7A" strokeWidth="2" opacity="0.5" />
          </svg>
        </div>

        <div className="absolute top-32 right-1/4 w-20 h-20 border-4 border-[#FF6E40]/20 rounded-lg rotate-12 animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 border-4 border-[#4FC3F7]/20 rounded-full animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-12 h-12 border-4 border-[#66BB6A]/20 rounded-lg -rotate-12 animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }}></div>

        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-[#37474F] via-[#455A64] to-[#546E7A] backdrop-blur-md border-b border-[#FF6E40]/20 px-8 py-6 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <Link href="/dashboard" className="text-[#B0BEC5] hover:text-[#FF6E40] transition-all transform hover:-translate-x-1">
                <ArrowLeft strokeWidth={3} />
              </Link>
              <div className="flex-1">
                <h1 className="text-white font-black text-3xl tracking-wide uppercase">
                  {dashboard?.name || "LOADING_PROJECT"}
                </h1>
                <p className="text-[#FF6E40] text-[10px] font-bold tracking-[0.25em] uppercase mt-1">
                  KEY: {dashboard?.accessKey} | ACTIVE MONITORING
                </p>
              </div>
            </div>

            {/* Right-side action buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                href={`/dashboard/${id}/report`}
                className="group relative bg-gradient-to-r from-[#FF6E40] to-[#FF5252] text-white px-8 py-3.5 rounded-full font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#FF6E40]/30 flex-1 md:flex-none text-center"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> REPORT NEW
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3.5 rounded-full font-bold text-sm transition-all tracking-widest shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          </div>
        </header>

        {/* Combined Stats Bar and Search/Filter - Single Row */}
        <div className="max-w-7xl mx-auto px-8 mt-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-[#37474F]/10 shadow-2xl">
            {/* Stats - Horizontal inline */}
            <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-[#ECEFF1]">
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#546E7A]/10 to-transparent px-4 py-2 rounded-xl border-l-4 border-[#546E7A]">
                <div>
                  <p className="text-[#546E7A] text-[10px] font-bold tracking-wider uppercase">TOTAL BUGS</p>
                  <p className="text-[#37474F] text-3xl font-black leading-none">{stats.total}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-[#FF6E40]/10 to-transparent px-4 py-2 rounded-xl border-l-4 border-[#FF6E40]">
                <div>
                  <p className="text-[#FF6E40] text-[10px] font-bold tracking-wider uppercase">OPEN</p>
                  <p className="text-[#FF6E40] text-3xl font-black leading-none">{stats.open}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-[#66BB6A]/10 to-transparent px-4 py-2 rounded-xl border-l-4 border-[#66BB6A]">
                <div>
                  <p className="text-[#66BB6A] text-[10px] font-bold tracking-wider uppercase">RESOLVED</p>
                  <p className="text-[#66BB6A] text-3xl font-black leading-none">{stats.resolved}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-[#FF5252]/10 to-transparent px-4 py-2 rounded-xl border-l-4 border-[#FF5252]">
                <div>
                  <p className="text-[#FF5252] text-[10px] font-bold tracking-wider uppercase">HIGH PRIORITY</p>
                  <p className="text-[#FF5252] text-3xl font-black leading-none">{stats.high}</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#546E7A]/50" />
                <input
                  type="text"
                  placeholder="Search bugs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-[#ECEFF1] rounded-xl border-2 border-transparent focus:border-[#FF6E40] focus:outline-none focus:ring-2 focus:ring-[#FF6E40]/20 font-semibold text-[#37474F] placeholder:text-[#546E7A]/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#546E7A]/50 hover:text-[#37474F] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex gap-3 items-center">
                <Filter className="w-5 h-5 text-[#546E7A]/70" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-5 py-3 bg-[#ECEFF1] rounded-xl border-2 border-transparent focus:border-[#FF6E40] focus:outline-none focus:ring-2 focus:ring-[#FF6E40]/20 font-bold text-xs uppercase tracking-wider text-[#37474F] transition-all cursor-pointer"
                >
                  <option value="all">ALL SEVERITY</option>
                  <option value="High">HIGH</option>
                  <option value="Normal">NORMAL</option>
                  <option value="Low">LOW</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-5 py-3 bg-[#ECEFF1] rounded-xl border-2 border-[#FF6E40] focus:border-[#FF5252] focus:outline-none focus:ring-2 focus:ring-[#FF6E40]/20 font-bold text-xs uppercase tracking-wider text-[#37474F] transition-all cursor-pointer"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="OPEN">OPEN</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || severityFilter !== "all" || statusFilter !== "all") && (
              <div className="mt-4 flex items-center gap-2 flex-wrap pt-4 border-t border-[#ECEFF1]">
                <span className="text-xs text-[#546E7A] font-bold uppercase tracking-wider">ACTIVE FILTERS:</span>
                {searchQuery && (
                  <span className="px-3 py-1.5 bg-[#FF6E40]/10 text-[#FF6E40] rounded-full text-xs font-bold border border-[#FF6E40]/20">
                    SEARCH: &quot;{searchQuery}&quot;
                  </span>
                )}
                {severityFilter !== "all" && (
                  <span className="px-3 py-1.5 bg-[#FF6E40]/10 text-[#FF6E40] rounded-full text-xs font-bold border border-[#FF6E40]/20">
                    SEVERITY: {severityFilter.toUpperCase()}
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="px-3 py-1.5 bg-[#FF6E40]/10 text-[#FF6E40] rounded-full text-xs font-bold border border-[#FF6E40]/20">
                    STATUS: {statusFilter}
                  </span>
                )}
                <button
                  onClick={() => { setSearchQuery(""); setSeverityFilter("all"); setStatusFilter("all"); }}
                  className="px-3 py-1.5 bg-[#546E7A]/10 text-[#546E7A] rounded-full text-xs font-bold border border-[#546E7A]/20 hover:bg-[#546E7A]/20 transition-colors"
                >
                  CLEAR ALL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bug List */}
        <main className="max-w-7xl mx-auto px-8 mt-6 space-y-4">
          {filteredBugs.length === 0 ? (
            <div className="text-center py-32 bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#546E7A]/30 shadow-xl">
              <Ghost className="w-12 h-12 text-[#B0BEC5] mx-auto mb-4" />
              <p className="font-black uppercase tracking-[0.3em] text-[#546E7A] text-sm">
                {bugs.length === 0 ? "NO BUGS LOGGED" : "NO RESULTS FOUND"}
              </p>
            </div>
          ) : (
            filteredBugs.map((bug) => {
              const theme = getSevTheme(bug.severity);
              const isResolved = bug.status === "RESOLVED";

              return (
                <div
                  key={bug.id}
                  className={`bg-white/90 backdrop-blur-md rounded-2xl p-6 border-2 shadow-lg transition-all ${
                    isResolved
                      ? "border-[#B0BEC5]/30 opacity-60"
                      : `${theme.border} hover:shadow-xl hover:shadow-${theme.glow}`
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl shrink-0 ${isResolved ? "bg-[#B0BEC5]/20" : theme.lightBg}`}>
                        <AlertCircle className={`w-5 h-5 ${isResolved ? "text-[#B0BEC5]" : theme.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className={`font-black text-base tracking-tight ${isResolved ? "text-[#B0BEC5] line-through" : "text-[#37474F]"}`}>
                            {bug.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${isResolved ? 'bg-[#B0BEC5]/20 text-[#B0BEC5]' : theme.bg + ' text-white'}`}>
                            {bug.severity}
                          </span>
                        </div>
                        <p className="text-[#546E7A] text-sm font-medium leading-relaxed">
                          {bug.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
                      {!isResolved ? (
                        <button
                          onClick={() => handleResolve(bug.id)}
                          className="bg-gradient-to-r from-[#37474F] to-[#455A64] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:from-[#FF6E40] hover:to-[#FF5252] transition-all whitespace-nowrap shadow-md hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                          MARK RESOLVED
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-[#66BB6A]/10 px-4 py-2.5 rounded-xl border border-[#66BB6A]/30">
                          <CheckCircle2 className="text-[#66BB6A] w-5 h-5" />
                          <span className="text-[#66BB6A] text-xs font-bold uppercase tracking-wider">RESOLVED</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleDelete(bug.id)}
                        className="p-3 text-[#B0BEC5] hover:text-[#FF5252] hover:bg-[#FF5252]/10 rounded-xl transition-all border-2 border-transparent hover:border-[#FF5252]/20"
                        aria-label="Delete bug"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}