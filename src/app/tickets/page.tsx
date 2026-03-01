"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STATUS_TABS = [
  { key: "", label: "Alle" },
  { key: "Open", label: "Offen" },
  { key: "InProgress", label: "In Bearbeitung" },
  { key: "Resolved", label: "Gelöst" },
  { key: "Closed", label: "Geschlossen" },
];
const STATUS_COLOR: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700",
  InProgress: "bg-yellow-50 text-yellow-700",
  Resolved: "bg-green-50 text-success",
  Closed: "bg-gray-100 text-muted",
};
const STATUS_LABEL: Record<string, string> = {
  Open: "Offen",
  InProgress: "In Bearbeitung",
  Resolved: "Gelöst",
  Closed: "Geschlossen",
};
const PRIORITY_COLOR: Record<string, string> = {
  Low: "bg-gray-100 text-muted",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-red-50 text-danger",
};
const PRIORITY_LABEL: Record<string, string> = {
  Low: "Niedrig",
  Medium: "Mittel",
  High: "Hoch",
  Critical: "Kritisch",
};
const CATEGORY_LABEL: Record<string, string> = {
  Bug: "Bug",
  Request: "Anfrage",
  Complaint: "Beschwerde",
  General: "Allgemein",
};

const defaultForm = { customerId: "", title: "", description: "", priority: "Medium", category: "General" };

export default function TicketsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    api.tickets(params.toString()).then(setItems).catch(() => setError("Fehler beim Laden"));
  };

  const loadDetail = (id: string) => {
    api.ticketById(id).then(setSelected).catch(() => {});
  };

  useEffect(() => {
    load();
    api.customers("").then((d: any) => setCustomers(d?.items || [])).catch(() => {});
  }, [statusFilter]);

  const filtered = items.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createTicket(form);
      setShowNew(false); setForm(defaultForm);
      setSuccess("Ticket angelegt"); setTimeout(() => setSuccess(""), 3000);
      load();
    } catch { setError("Fehler beim Anlegen"); }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await api.updateTicketStatus(id, { status });
      load();
      if (selected?.id === id) loadDetail(id);
    } catch { setError("Fehler beim Status-Update"); }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !commentText.trim()) return;
    try {
      await api.addTicketComment(selected.id, { content: commentText, isInternal: false });
      setCommentText(""); loadDetail(selected.id);
    } catch { setError("Fehler beim Kommentieren"); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" wirklich löschen?`)) return;
    try { await api.deleteTicket(id); setSelected(null); load(); } catch { setError("Fehler beim Löschen"); }
  }

  const openCount = items.filter(t => t.status === "Open").length;
  const inProgressCount = items.filter(t => t.status === "InProgress").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted mt-0.5">{openCount} offen · {inProgressCount} in Bearbeitung</p>
        </div>
        <div className="flex items-center gap-3">
          <input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm w-44" />
          <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">+ Neues Ticket</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">×</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${statusFilter === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}>{t.label}</button>
        ))}
      </div>

      <div className={`flex gap-6 ${selected ? "" : ""}`}>
        {/* Ticket List */}
        <div className={selected ? "w-1/2" : "w-full"}>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs text-muted">Titel</th>
                  <th className="px-4 py-3 text-left text-xs text-muted">Kunde</th>
                  <th className="px-4 py-3 text-left text-xs text-muted">Priorität</th>
                  <th className="px-4 py-3 text-left text-xs text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-muted hidden lg:table-cell">SLA</th>
                  <th className="px-4 py-3 text-left text-xs text-muted hidden lg:table-cell">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => {
                  const slaOverdue = t.slaDueDate && new Date(t.slaDueDate) < new Date() && !["Resolved", "Closed"].includes(t.status);
                  return (
                    <tr key={t.id} onClick={() => loadDetail(t.id)} className={`border-b border-border cursor-pointer hover:bg-background/60 ${selected?.id === t.id ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{t.title}</div>
                        {t.commentCount > 0 && <div className="text-xs text-muted">{t.commentCount} Kommentar{t.commentCount > 1 ? "e" : ""}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{t.customerName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLOR[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select value={t.status} onChange={e => { e.stopPropagation(); handleStatusChange(t.id, e.target.value); }} onClick={e => e.stopPropagation()} className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLOR[t.status]}`}>
                          {Object.keys(STATUS_LABEL).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell">
                        {t.slaDueDate ? <span className={slaOverdue ? "text-danger font-medium" : "text-muted"}>{slaOverdue ? "⚠ " : ""}{new Date(t.slaDueDate).toLocaleDateString("de-DE")}</span> : <span className="text-muted">–</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted hidden lg:table-cell">{new Date(t.createdAt).toLocaleDateString("de-DE")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Tickets gefunden.</div>}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-1/2 bg-surface border border-border rounded-xl p-5 h-fit sticky top-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold">{selected.title}</h2>
                <p className="text-sm text-muted">{selected.customerName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDelete(selected.id, selected.title)} className="text-xs text-danger hover:underline">Löschen</button>
                <button onClick={() => setSelected(null)} className="text-muted hover:text-text text-lg leading-none">×</button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mb-4">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLOR[selected.priority]}`}>{PRIORITY_LABEL[selected.priority]}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-muted font-medium">{CATEGORY_LABEL[selected.category]}</span>
            </div>

            {selected.description && <p className="text-sm text-muted mb-4 p-3 bg-background rounded-lg">{selected.description}</p>}

            <div className="flex gap-2 mb-4">
              {["Open", "InProgress", "Resolved", "Closed"].map(s => (
                <button key={s} onClick={() => handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${selected.status === s ? "bg-primary text-white border-primary" : "border-border hover:bg-background"}`}>{STATUS_LABEL[s]}</button>
              ))}
            </div>

            {selected.slaDueDate && (
              <div className={`text-xs mb-4 p-2 rounded-lg ${new Date(selected.slaDueDate) < new Date() && !["Resolved", "Closed"].includes(selected.status) ? "bg-red-50 text-danger" : "bg-background text-muted"}`}>
                SLA-Frist: {new Date(selected.slaDueDate).toLocaleString("de-DE")}
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-3">Kommentare ({selected.comments?.length || 0})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {(selected.comments || []).map((c: any) => (
                  <div key={c.id} className={`p-2 rounded-lg text-sm ${c.isInternal ? "bg-yellow-50 border border-yellow-100" : "bg-background"}`}>
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>{c.authorName || "System"}{c.isInternal && " · intern"}</span>
                      <span>{new Date(c.createdAt).toLocaleString("de-DE")}</span>
                    </div>
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Kommentar schreiben..." className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
                <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg text-sm">Senden</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Neues Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Kunde *</label>
                <select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Bitte wählen...</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Priorität</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                    <option value="Low">Niedrig</option>
                    <option value="Medium">Mittel</option>
                    <option value="High">Hoch</option>
                    <option value="Critical">Kritisch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                    <option value="General">Allgemein</option>
                    <option value="Bug">Bug</option>
                    <option value="Request">Anfrage</option>
                    <option value="Complaint">Beschwerde</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Anlegen</button>
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
