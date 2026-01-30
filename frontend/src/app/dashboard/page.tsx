"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Plus, Layout, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Dashboard {
  id: string;
  name: string;
  accessKey: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const res = await api.get("/dashboards");
        setDashboards(res.data);
      } catch (err) {
        // If unauthorized, send back to login
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) return <div className="p-10 text-center">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Layout className="text-blue-600 w-6 h-6" />
              <span className="font-bold text-xl tracking-tight">Triage</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Dashboards</h1>
            <p className="text-gray-500">Select a project to view bug reports</p>
          </div>
          <Link 
            href="/dashboard/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create New
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.length === 0 ? (
            <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-500 mb-4">You have not joined any dashboards yet.</p>
              <Link href="/dashboard/new" className="text-blue-600 font-semibold hover:underline">
                Create your first project &rarr;
              </Link>
            </div>
          ) : (
            dashboards.map((db) => (
              <Link 
                key={db.id} 
                href={`/dashboard/${db.id}`}
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition">
                      {db.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-widest">
                      Key: {db.accessKey}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}