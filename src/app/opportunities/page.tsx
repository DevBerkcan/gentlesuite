"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const STAGES = ["Qualification", "Proposal", "Negotiation", "ClosedWon", "ClosedLost"];
const STAGE_LABEL: Record<string, string> = {
  Qualification: "Qualifizierung",
  Proposal: "Angebot",
  Negotiation: "Verhandlung",
  ClosedWon: "Gewonnen",
  ClosedLost: "Verloren",
};
const STAGE_COLOR: Record<string, string> = {
  Qualification: "bg-blue-50 text-blue-700 border-blue-200",
  Proposal: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Negotiation: "bg-orange-50 text-orange-700 border-orange-200",
  ClosedWon: "bg-green-50 text-success border-green-200",
  ClosedLost: "bg-red-50 text-danger border-red-200",
};
const STAGE_HEADER: Record<string, string> = {
  Qualification: "border-t-blue-400",
  Proposal: "border-t-yellow-400",
  Negotiation: "border-t-orange-400",
  ClosedWon: "border-t-green-400",
  ClosedLost: "border-t-red-400",
};

const defaultForm = { customerId: "", title: "", stage: "Qualification", probability: 10, expectedRevenue: 0, closeDate: "", notes: "" };

export default function OpportunitiesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [stageFilter, setStageFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (stageFilter) params.set("stage", stageFilter);
    api.opportunities(params.toString()).then(setItems).catch(() => setError("Fehler beim Laden"));
  };

  useEffect(() => {
    load();
    api.customers("").then((d: any) => setCustomers(d?.items || [])).catch(() => {});
  }, [stageFilter]);

  const filtered = items.filter(o =>
    !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createOpportunity({ ...form, probability: Number(form.probability), expectedRevenue: Number(form.expectedRevenue), closeDate: form.closeDate || null });
      setShowNew(false); setForm(defaultForm); setSuccess("Opportunity angelegt"); setTimeout(() => setSuccess(""), 3000); load();
    } catch { setError("Fehler beim Anlegen"); }
  }

  async function handleStageChange(id: string, stage: string) {
    try { await api.updateOpportunityStage(id, { stage }); load(); } catch { setError("Fehler beim Verschieben"); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" wirklich löschen?`)) return;
    try { await api.deleteOpportunity(id); load(); } catch { setError("Fehler beim Löschen"); }
  }

  const totalValue = filtered.filter(o => !["ClosedLost"].includes(o.stage)).reduce((s: number, o: any) => s + (o.expectedRevenue || 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold">Opportunities</h1>
          <p className="text-sm text-muted mt-0.5">Pipeline-Wert: {totalValue.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="flex items-center gap-3">
          <input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm w-44" />
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-sm ${view === "kanban" ? "bg-primary text-white" : "hover:bg-background"}`}>Kanban</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-primary text-white" : "hover:bg-background"}`}>Liste</button>
          </div>
          <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">+ Neu</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">×</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Stage filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {[{ key: "", label: "Alle" }, ...STAGES.map(s => ({ key: s, label: STAGE_LABEL[s] }))].map(t => (
          <button key={t.key} onClick={() => setStageFilter(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stageFilter === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}>{t.label}</button>
        ))}
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const cols = filtered.filter(o => o.stage === stage);
            const colValue = cols.reduce((s: number, o: any) => s + (o.expectedRevenue || 0), 0);
            return (
              <div key={stage} className={`flex-shrink-0 w-64 bg-surface border border-border rounded-xl border-t-4 ${STAGE_HEADER[stage]}`}>
                <div className="p-3 border-b border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{STAGE_LABEL[stage]}</span>
                    <span className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">{cols.length}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{colValue.toLocaleString("de-DE", { minimumFractionDigits: 0 })} €</p>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {cols.map((o: any) => (
                    <div key={o.id} className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 group">
                      <div className="flex justify-between items-start gap-1">
                        <p className="text-sm font-medium leading-tight">{o.title}</p>
                        <button onClick={() => handleDelete(o.id, o.title)} className="opacity-0 group-hover:opacity-100 text-danger text-xs px-1">×</button>
                      </div>
                      <p className="text-xs text-muted mt-1">{o.customerName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-medium text-primary">{Number(o.expectedRevenue).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €</span>
                        <span className="text-xs text-muted">{o.probability}%</span>
                      </div>
                      {o.closeDate && <p className="text-xs text-muted mt-1">Bis: {new Date(o.closeDate).toLocaleDateString("de-DE")}</p>}
                      {/* Stage changer */}
                      <select value={o.stage} onChange={e => handleStageChange(o.id, e.target.value)} onClick={e => e.stopPropagation()} className="mt-2 w-full text-xs border border-border rounded px-1.5 py-1 bg-surface">
                        {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left text-xs text-muted">Titel</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Kunde</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Phase</th>
                <th className="px-4 py-3 text-right text-xs text-muted">Wert</th>
                <th className="px-4 py-3 text-right text-xs text-muted">Wahrsch.</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Abschluss</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} className="border-b border-border hover:bg-background/60">
                  <td className="px-4 py-3 text-sm font-medium">{o.title}</td>
                  <td className="px-4 py-3 text-sm text-muted">{o.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STAGE_COLOR[o.stage]}`}>{STAGE_LABEL[o.stage]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{Number(o.expectedRevenue).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                  <td className="px-4 py-3 text-sm text-right text-muted">{o.probability}%</td>
                  <td className="px-4 py-3 text-sm text-muted">{o.closeDate ? new Date(o.closeDate).toLocaleDateString("de-DE") : "–"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(o.id, o.title)} className="text-xs text-danger hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Opportunities gefunden.</div>}
        </div>
      )}

      {/* Create Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Neue Opportunity</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Phase</label>
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Wahrscheinlichkeit (%)</label>
                  <input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Erwarteter Umsatz (€)</label>
                  <input type="number" step="0.01" value={form.expectedRevenue} onChange={e => setForm({ ...form, expectedRevenue: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Abschlussdatum</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({ ...form, closeDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notizen</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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
