"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, LayoutDashboard, Key, ArrowRight, TrendingUp, Activity } from "lucide-react";
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
    
    fetchDashboards();
  }, []);

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
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#FF6E40]/10 to-[#FF5252]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-[#4FC3F7]/10 to-[#81D4FA]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#66BB6A]/10 to-[#4CAF50]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
        
        {/* Tech-themed floating shapes */}
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

        {/* Binary code patterns */}
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

        {/* Hexagon tech patterns */}
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

        {/* Data flow lines */}
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

        {/* Microchip illustrations */}
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

        {/* Network nodes */}
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
            <Link href="/dashboard/new" className="bg-gradient-to-r from-[#FF6E40] to-[#FF5252] text-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF6E40]/30 w-full sm:w-auto justify-center">
              <Plus className="w-5 h-5" /> NEW PROJECT
            </Link>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-8 md:p-10">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[#FF6E40]" />
              <h2 className="text-[#546E7A] text-xs font-bold uppercase tracking-[0.25em]">ACTIVE WORKSPACES</h2>
            </div>
          </div>

          {/* Dashboard Grid */}
          {dashboards.length === 0 ? (
            <div className="text-center py-32 bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#546E7A]/30 shadow-xl">
              <div className="w-16 h-16 bg-[#546E7A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-8 h-8 text-[#546E7A]/50" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[#546E7A] text-sm mb-2">NO PROJECTS YET</p>
              <p className="text-[#546E7A]/70 text-sm mb-6">Create your first project to start tracking bugs</p>
              <Link href="/dashboard/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6E40] to-[#FF5252] text-white px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF6E40]/30">
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
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Decorative Corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6E40]/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Icon Badge */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-[#FF6E40]/10 to-[#FF5252]/5 rounded-xl flex items-center justify-center border-2 border-[#FF6E40]/20 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <TrendingUp className="w-6 h-6 text-[#FF6E40]" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-[#37474F] mb-4 group-hover:text-[#FF6E40] transition-colors tracking-tight">
                      {db.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 bg-[#ECEFF1] px-4 py-2 rounded-xl mb-6 border border-[#546E7A]/10">
                      <Key className="w-4 h-4 text-[#546E7A]" />
                      <span className="text-[#546E7A] font-bold text-xs uppercase tracking-wider">{db.accessKey}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[#37474F] font-bold text-sm group-hover:text-[#FF6E40] transition-colors">
                      <span>OPEN BOARD</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>

                  {/* Hover Effect Border */}
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