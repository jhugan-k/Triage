"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Plus, 
  Bug as BugIcon, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2 
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

export default function BugBoard() {
  const { id } = useParams();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch bugs from Backend
  const fetchBugs = async () => {
    try {
      const res = await api.get(`/dashboards/${id}/bugs`);
      setBugs(res.data);
    } catch (err) {
      console.error("Failed to fetch bugs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [id]);

  // 2. Task 20: Resolution Logic
  const handleResolve = async (bugId: string) => {
    try {
      await api.patch(`/bugs/${bugId}/resolve`);
      // Update local state so the UI changes instantly
      setBugs((prev) =>
        prev.map((b) => (b.id === bugId ? { ...b, status: "RESOLVED" } : b))
      );
    } catch (err) {
      alert("Failed to resolve bug");
    }
  };

  // 3. Helper for severity colors
  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case "High": return "bg-red-50 text-red-700 border-red-200";
      case "Normal": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading Bug Reports...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto py-12 px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-100 transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Project Board</h1>
              <p className="text-gray-500 text-sm font-medium">Live AI Classification active</p>
            </div>
          </div>
          <Link 
            href={`/dashboard/${id}/report`}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <Plus className="w-5 h-5" />
            Report New Bug
          </Link>
        </div>

        {/* Bug List */}
        <div className="grid gap-4">
          {bugs.length === 0 ? (
            <div className="bg-white rounded-3xl p-24 text-center border-2 border-dashed border-gray-200">
              <BugIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">No bugs detected</h3>
              <p className="text-gray-500 mt-2">New incidents analyzed by AI will appear here.</p>
            </div>
          ) : (
            bugs.map((bug) => (
              <div 
                key={bug.id} 
                className={`bg-white p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  bug.status === 'RESOLVED' ? 'opacity-60 border-gray-100' : 'border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex gap-5">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${getSeverityStyles(bug.severity)}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg text-gray-900 ${bug.status === 'RESOLVED' ? 'line-through' : ''}`}>
                      {bug.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 max-w-xl">{bug.description}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(bug.createdAt).toLocaleDateString()}
                      </span>
                      
                      {bug.status === 'RESOLVED' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleResolve(bug.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider underline underline-offset-4"
                        >
                          Mark as Fixed
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${getSeverityStyles(bug.severity)}`}>
                    {bug.severity}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${bug.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {bug.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}