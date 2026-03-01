"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function EmailsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { api.emailLogs().then(setData).catch(() => setError("E-Mail-Protokoll konnte nicht geladen werden")); }, []);

  const filtered = (data?.items || []).filter((e: any) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.recipientEmail?.toLowerCase().includes(q) && !e.subject?.toLowerCase().includes(q) && !e.templateKey?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statusMap: Record<string, string> = { Sent: "Gesendet", Failed: "Fehlgeschlagen", Queued: "Warteschlange" };
  const statusColor: Record<string, string> = { Sent: "bg-green-50 text-success", Failed: "bg-red-50 text-danger", Queued: "bg-yellow-50 text-warning" };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">E-Mail-Protokoll</h1>
        <div className="flex items-center gap-3">
          <input placeholder="Suche..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm w-48" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="Sent">Gesendet</option>
            <option value="Failed">Fehlgeschlagen</option>
            <option value="Queued">Warteschlange</option>
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Empfaenger</th><th className="px-4 py-3 text-left text-xs text-muted">Betreff</th><th className="px-4 py-3 text-left text-xs text-muted">Template</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th><th className="px-4 py-3 text-left text-xs text-muted">Datum</th></tr></thead>
          <tbody>{filtered.map((e: any) => (
            <tr key={e.id} className="border-b border-border">
              <td className="px-4 py-3 text-sm">{e.recipientEmail}</td>
              <td className="px-4 py-3 text-sm">{e.subject || "–"}</td>
              <td className="px-4 py-3 text-sm text-muted">{e.templateKey || "–"}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[e.status] || "bg-gray-100 text-muted"}`}>{statusMap[e.status] || e.status}</span></td>
              <td className="px-4 py-3 text-sm text-muted">{new Date(e.createdAt).toLocaleString("de")}</td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine E-Mails vorhanden.</div>}
      </div>
    </div>
  );
}
