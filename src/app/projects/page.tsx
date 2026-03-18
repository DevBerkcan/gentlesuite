"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const statusMap: Record<string, { label: string; cls: string }> = {
  Planning: { label: "Planung", cls: "bg-gray-100 text-gray-700" },
  InProgress: { label: "In Arbeit", cls: "bg-blue-50 text-blue-700" },
  Completed: { label: "Abgeschlossen", cls: "bg-green-50 text-success" },
  OnHold: { label: "Pausiert", cls: "bg-yellow-50 text-warning" },
};

export default function ProjectsPage() {
  const [data, setData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm, clearForm] = useLocalStorage("draft:project-create", { customerId: "", name: "", description: "", startDate: "", dueDate: "", onboardingTemplateId: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function load(status = "") {
    api.projects(status ? `status=${status}` : "").then(setData).catch(() => setError("Projekte konnten nicht geladen werden"));
  }

  useEffect(() => {
    load();
    api.customers().then((r: any) => setCustomers(r.items || [])).catch(() => {});
    api.onboardingTemplates().then((r: any) => {
      const list = (r || []) as any[];
      setTemplates(list);
      const defaultTemplate = list.find((t) => t.isDefault);
      if (defaultTemplate?.id) {
        setForm((prev) => ({ ...prev, onboardingTemplateId: prev.onboardingTemplateId || defaultTemplate.id }));
      }
    }).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.customerId) nextErrors.customerId = "Bitte einen Kunden auswaehlen.";
    if (!form.name.trim()) nextErrors.name = "Projektname ist erforderlich.";
    if (!form.onboardingTemplateId) nextErrors.onboardingTemplateId = "Onboarding-Template ist erforderlich.";
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) nextErrors.dueDate = "Faelligkeit darf nicht vor dem Startdatum liegen.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const payload: any = { ...form };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.description) delete payload.description;
      await api.createProject(payload);
      const defaultTemplate = templates.find((t: any) => t.isDefault);
      setShowNew(false);
      clearForm();
      setFieldErrors({});
      setError("");
      setSuccess("Projekt erfolgreich angelegt");
      setTimeout(() => setSuccess(""), 4000);
      load(statusFilter);
    } catch (e: any) {
      setError(e?.message || "Fehler beim Anlegen des Projekts");
    }
  }

  const s = (status: string) => statusMap[status] || { label: status, cls: "bg-gray-100 text-gray-700" };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Projekte</h1>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="Planning">Planung</option>
            <option value="InProgress">In Arbeit</option>
            <option value="Completed">Abgeschlossen</option>
            <option value="OnHold">Pausiert</option>
          </select>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">+ Neues Projekt</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left text-xs text-muted">Name</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Kunde</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Status</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Start</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Faellig</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((p: any) => (
              <tr key={p.id} className="border-b border-border hover:bg-background cursor-pointer" onClick={() => (window.location.href = `/projects/${p.id}`)}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.customerName}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${s(p.status).cls}`}>{s(p.status).label}</span></td>
                <td className="px-4 py-3 text-sm text-muted">{p.startDate ? new Date(p.startDate).toLocaleDateString("de") : "–"}</td>
                <td className="px-4 py-3 text-sm text-muted">{p.dueDate ? new Date(p.dueDate).toLocaleDateString("de") : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items?.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Projekte vorhanden.</div>}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-surface rounded-xl border border-border p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Neues Projekt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Kunde *</label>
                <select required value={form.customerId} onChange={e => { setForm({ ...form, customerId: e.target.value }); setFieldErrors(prev => ({ ...prev, customerId: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Bitte waehlen...</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
                {fieldErrors.customerId && <p className="text-xs text-danger mt-1">{fieldErrors.customerId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Projektname *</label>
                <input required value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setFieldErrors(prev => ({ ...prev, name: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Beschreibung</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Startdatum</label>
                  <input type="date" value={form.startDate} onChange={e => { setForm({ ...form, startDate: e.target.value }); setFieldErrors(prev => ({ ...prev, dueDate: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Faellig</label>
                  <input type="date" value={form.dueDate} onChange={e => { setForm({ ...form, dueDate: e.target.value }); setFieldErrors(prev => ({ ...prev, dueDate: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  {fieldErrors.dueDate && <p className="text-xs text-danger mt-1">{fieldErrors.dueDate}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Onboarding-Template *</label>
                <select required value={form.onboardingTemplateId} onChange={e => { setForm({ ...form, onboardingTemplateId: e.target.value }); setFieldErrors(prev => ({ ...prev, onboardingTemplateId: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="" disabled>Bitte Template wählen...</option>
                  {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " (Default)" : ""} ({t.stepCount} Schritte)</option>)}
                </select>
                {fieldErrors.onboardingTemplateId && <p className="text-xs text-danger mt-1">{fieldErrors.onboardingTemplateId}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setShowNew(false); setFieldErrors({}); }} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">Abbrechen</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">Anlegen</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
