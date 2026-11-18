// src/components/admin/tabs/AskPezaTab.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, XCircle, MessageCircle, Clock, Search } from "lucide-react";
import { AskPezaRequest } from "@/types/askPeza";
import { getAllAskPezaRequests, updateAskPezaRequest } from "@/services/askPezaService";

type Tab = "pending" | "resolved";

export function AskPezaTab() {
  const [requests, setRequests] = useState<AskPezaRequest[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadRequests = async () => {
    setIsFetching(true);
    try {
      const data = await getAllAskPezaRequests();
      setRequests(data);
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleMarkFound = async (req: AskPezaRequest) => {
    const notes = window.prompt("Any internal notes? (e.g. 'Found at XYZ shop for K150')", "");
    if (notes === null) return; // User cancelled

    setBusyId(req.id);
    try {
      await updateAskPezaRequest(req.id, { status: "found", adminNotes: notes.trim() });
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "found", adminNotes: notes.trim() } : r));
      toast.success("Marked as found.");
    } catch {
      toast.error("Failed to update request.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (req: AskPezaRequest) => {
    if (!window.confirm("Cancel this request?")) return;
    setBusyId(req.id);
    try {
      await updateAskPezaRequest(req.id, { status: "cancelled" });
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "cancelled" } : r));
      toast.success("Request cancelled.");
    } catch {
      toast.error("Failed to cancel request.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = requests
    .filter((r) => (tab === "pending" ? r.status === "pending" : r.status !== "pending"))
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        r.requestText.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userPhone.includes(q)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={20} />
            Ask Peza Concierge
          </h2>
          <p className="text-xs text-gray-400 mt-1">Source items, rooms, and services for students.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search requests or names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl bg-gray-900/50 p-1">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
            tab === "pending" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <Clock size={14} /> Pending ({requests.filter(r => r.status === "pending").length})
        </button>
        <button
          onClick={() => setTab("resolved")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
            tab === "resolved" ? "bg-emerald-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <CheckCircle2 size={14} /> Resolved ({requests.filter(r => r.status !== "pending").length})
        </button>
      </div>

      {isFetching ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
          <Sparkles size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">
            {tab === "pending" ? "No pending requests right now." : "No resolved requests yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const waNumber = req.userPhone.replace(/\D/g, "");
            const waLink = `https://wa.me/${waNumber}?text=Hi ${req.userName}, this is Peza Concierge. We found what you asked for!`;

            return (
              <div key={req.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">{req.requestText}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                      <span>Requested by: <strong className="text-gray-200">{req.userName}</strong></span>
                      <span>Phone: <strong className="text-gray-200">{req.userPhone}</strong></span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    {req.adminNotes && (
                      <p className="mt-2 text-[11px] text-amber-300 bg-amber-900/20 px-2 py-1 rounded inline-block border border-amber-800/50">
                        Note: {req.adminNotes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {req.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleMarkFound(req)}
                          disabled={busyId === req.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Mark as Found
                        </button>
                        <button
                          onClick={() => handleCancel(req)}
                          disabled={busyId === req.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-900 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      </>
                    ) : (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        <MessageCircle size={14} /> WhatsApp Student
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}