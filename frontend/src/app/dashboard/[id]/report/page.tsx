"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ReportBug() {
  const router = useRouter();
  const { id } = useParams();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/bugs", {
        title,
        description,
        dashboardId: id,
      });
      router.push(`/dashboard/${id}`);
    } catch (err) {
      setError("Analysis failed. Ensure the AI and Backend servers are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <Link href={`/dashboard/${id}`} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Board
      </Link>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Simplified Header */}
        <div className="bg-blue-600 p-8 rounded-t-xl text-white">
          <h1 className="text-2xl font-bold">Report Incident</h1>
          <p className="text-blue-100 text-sm mt-1">Our AI will automatically determine the severity.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Summary</label>
            <input
              type="text"
              required
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-gray-900"
              placeholder="e.g. Server crash on login"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description</label>
            <textarea
              required
              rows={6}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-gray-900"
              placeholder="Describe the steps to reproduce the bug..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "AI is Analyzing..." : "Submit to Triage"}
          </button>
        </form>
      </div>
    </div>
  );
}