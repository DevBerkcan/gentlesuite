"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function EmailTemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ key: "", subject: "", body: "", variablesSchema: "", isActive: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { load(); }, []);
  function load() { api.emailTemplates().then(setItems).catch(() => setError("E-Mail-Vorlagen konnten nicht geladen werden")); }

  function startEdit(item: any) {
    setEditId(item.id);
    setForm({ key: item.key, subject: item.subject, body: item.body, variablesSchema: item.variablesSchema || "", isActive: item.isActive });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, variablesSchema: form.variablesSchema || null };
      if (editId) await api.updateEmailTemplate(editId, payload);
      else await api.createEmailTemplate(payload);
      setShowForm(false); setEditId(null);
      setForm({ key: "", subject: "", body: "", variablesSchema: "", isActive: true });
      setSuccess(editId ? "Vorlage aktualisiert" : "Vorlage erstellt");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch { setError("Fehler beim Speichern"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("E-Mail-Vorlage wirklich loeschen?")) return;
    try { await api.deleteEmailTemplate(id); load(); } catch { setError("Fehler beim Loeschen"); }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">E-Mail-Vorlagen</h1>
        <button onClick={() => { setEditId(null); setForm({ key: "", subject: "", body: "", variablesSchema: "", isActive: true }); setShowForm(true); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">+ Neue Vorlage</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Key</th><th className="px-4 py-3 text-left text-xs text-muted">Betreff</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th><th className="px-4 py-3 text-right text-xs text-muted">Aktionen</th></tr></thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium text-sm">{item.key}</td>
                <td className="px-4 py-3 text-sm">{item.subject}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${item.isActive ? "bg-green-50 text-success" : "bg-gray-100 text-muted"}`}>{item.isActive ? "Aktiv" : "Inaktiv"}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(item)} className="text-xs text-primary hover:underline mr-2">Bearbeiten</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-danger hover:underline">Loeschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine E-Mail-Vorlagen vorhanden.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editId ? "Vorlage bearbeiten" : "Neue E-Mail-Vorlage"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Key *</label><input required value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="z.B. quote_sent" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Betreff *</label><input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Inhalt *</label><textarea required rows={8} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm font-medium mb-1">Variablen-Schema (optional)</label><input value={form.variablesSchema} onChange={e => setForm({ ...form, variablesSchema: e.target.value })} placeholder="z.B. {{customerName}}, {{quoteNumber}}" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="isActive" className="text-sm">Aktiv</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Speichern</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
