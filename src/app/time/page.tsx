"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trash2, Pencil } from "lucide-react";

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function TimePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const [form, setForm] = useState({
    projectId: "",
    customerId: "",
    description: "",
    hours: "",
    date: formatDate(today),
    isBillable: true,
    hourlyRate: "",
  });

  const [filterFrom, setFilterFrom] = useState(formatDate(weekStart));
  const [filterTo, setFilterTo] = useState(formatDate(weekEnd));
  const [filterProject, setFilterProject] = useState("");
  const [filterBillable, setFilterBillable] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState("");
  const [invoiceSubject, setInvoiceSubject] = useState("");
  const [invoicing, setInvoicing] = useState(false);

  function buildFilterParams() {
    const parts: string[] = [];
    if (filterFrom) parts.push(`from=${filterFrom}`);
    if (filterTo) parts.push(`to=${filterTo}`);
    if (filterProject) parts.push(`projectId=${filterProject}`);
    if (filterBillable) parts.push(`isBillable=${filterBillable}`);
    return parts.join("&");
  }

  function load() {
    api.timeEntries(buildFilterParams()).then(setEntries).catch(() => setError("Zeiteintraege konnten nicht geladen werden"));
    api.timeSummary(filterFrom || formatDate(weekStart), filterTo || formatDate(weekEnd), filterProject || undefined).then(setSummary).catch(() => {});
  }

  useEffect(() => {
    load();
    api.projects().then((r: any) => setProjects(r.items || [])).catch(() => {});
    api.customers().then((r: any) => setCustomers(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterFrom, filterTo, filterProject, filterBillable]);

  function startEdit(entry: any) {
    setEditId(entry.id);
    setForm({
      projectId: entry.projectId || "",
      customerId: entry.customerId || "",
      description: entry.description,
      hours: String(entry.hours),
      date: formatDate(new Date(entry.date)),
      isBillable: entry.isBillable,
      hourlyRate: entry.hourlyRate ? String(entry.hourlyRate) : "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ projectId: "", customerId: "", description: "", hours: "", date: formatDate(today), isBillable: true, hourlyRate: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = {
        description: form.description,
        hours: parseFloat(form.hours),
        date: new Date(form.date).toISOString(),
        isBillable: form.isBillable,
      };
      if (form.projectId) payload.projectId = form.projectId;
      if (form.customerId) payload.customerId = form.customerId;
      if (form.hourlyRate) payload.hourlyRate = parseFloat(form.hourlyRate);
      if (editId) {
        await api.updateTimeEntry(editId, payload);
        setSuccess("Zeiteintrag aktualisiert");
      } else {
        await api.createTimeEntry(payload);
        setSuccess("Zeiteintrag erfolgreich erstellt");
      }
      cancelEdit();
      setError("");
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch {
      setError(editId ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen des Zeiteintrags");
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function handleInvoice() {
    if (!invoiceCustomerId) { setError("Bitte Kunde auswählen."); return; }
    setInvoicing(true);
    try {
      const inv = await api.createInvoiceFromTimeEntries({ customerId: invoiceCustomerId, timeEntryIds: Array.from(selected), subject: invoiceSubject || undefined });
      setInvoiceModal(false); setSelected(new Set());
      setSuccess(`Rechnung ${inv.invoiceNumber} erstellt.`);
      setTimeout(() => setSuccess(""), 5000);
      load();
    } catch (e: any) { setError(e.message || "Fehler beim Erstellen der Rechnung"); }
    finally { setInvoicing(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Zeiteintrag wirklich loeschen?")) return;
    try {
      await api.deleteTimeEntry(id);
      setSuccess("Eintrag geloescht");
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch {
      setError("Fehler beim Loeschen");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Zeiterfassung</h1>
          {selected.size > 0 && (
            <button onClick={() => setInvoiceModal(true)} className="px-3 py-1.5 bg-success text-white rounded-lg text-sm font-medium">
              {selected.size} Einträge fakturieren
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
          <span className="text-sm text-muted">bis</span>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Projekte</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterBillable} onChange={e => setFilterBillable(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle</option>
            <option value="true">Abrechenbar</option>
            <option value="false">Nicht abrechenbar</option>
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Gesamt (Woche)</p>
            <p className="text-2xl font-bold">{summary.totalHours?.toFixed(1)} h</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Abrechenbar</p>
            <p className="text-2xl font-bold text-success">{summary.billableHours?.toFixed(1)} h</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Nicht abrechenbar</p>
            <p className="text-2xl font-bold text-warning">{summary.nonBillableHours?.toFixed(1)} h</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Abrechenbarer Betrag</p>
            <p className="text-2xl font-bold text-primary">{summary.billableAmount?.toFixed(2)} EUR</p>
          </div>
        </div>
      )}

      {/* Quick Entry Form */}
      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="font-semibold mb-4">{editId ? "Eintrag bearbeiten" : "Neuer Eintrag"}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Projekt</label>
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="">Kein Projekt</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Kunde</label>
            <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="">Kein Kunde</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Datum *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Stunden *</label>
            <input type="number" step="0.25" min="0.25" required value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="1.5" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-text mb-1">Beschreibung *</label>
            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Was wurde gemacht?" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Stundensatz (EUR)</label>
            <input type="number" step="0.01" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="85.00" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isBillable} onChange={e => setForm({ ...form, isBillable: e.target.checked })} className="accent-primary" />
              Abrechenbar
            </label>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">{editId ? "Speichern" : "Erfassen"}</button>
            {editId && <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>}
          </div>
        </div>
      </form>

      {/* Entries Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs text-muted">Datum</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Projekt</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Kunde</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Beschreibung</th>
              <th className="px-4 py-3 text-right text-xs text-muted">Stunden</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Abrechenbar</th>
              <th className="px-4 py-3 text-left text-xs text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e: any) => (
              <tr key={e.id} className={`border-b border-border hover:bg-background ${editId === e.id ? "bg-primary/5" : ""} ${selected.has(e.id) ? "bg-blue-50" : ""}`}>
                <td className="px-4 py-2 w-8">
                  {!e.isInvoiced && e.isBillable && (
                    <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="accent-primary" onClick={ev => ev.stopPropagation()} />
                  )}
                  {e.isInvoiced && <span className="text-xs text-success">✓</span>}
                </td>
                <td className="px-4 py-3 text-sm">{new Date(e.date).toLocaleDateString("de")}</td>
                <td className="px-4 py-3 text-sm">{e.projectName || "–"}</td>
                <td className="px-4 py-3 text-sm">{e.customerName || "–"}</td>
                <td className="px-4 py-3 text-sm">{e.description}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{e.hours?.toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${e.isBillable ? "bg-green-50 text-success" : "bg-gray-100 text-gray-700"}`}>{e.isBillable ? "Ja" : "Nein"}</span></td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => startEdit(e)} className="text-primary hover:text-primary-hover transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(e.id)} className="text-danger hover:text-red-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Zeiteintraege vorhanden.</div>}
      </div>

      {invoiceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Rechnung aus Zeiteinträgen</h2>
            <p className="text-sm text-muted mb-4">{selected.size} Einträge werden fakturiert.</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted block mb-1">Kunde *</label>
                <select value={invoiceCustomerId} onChange={e => setInvoiceCustomerId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
                  <option value="">Bitte wählen...</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Betreff (optional)</label>
                <input value={invoiceSubject} onChange={e => setInvoiceSubject(e.target.value)} placeholder="z.B. Webprojekt März 2025" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleInvoice} disabled={invoicing} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">{invoicing ? "Erstelle..." : "Rechnung erstellen"}</button>
              <button onClick={() => setInvoiceModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
