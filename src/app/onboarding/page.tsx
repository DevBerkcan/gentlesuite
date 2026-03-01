"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function OnboardingPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", isDefault: false, steps: [] as any[] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { load(); }, []);
  function load() { api.onboardingTemplates().then(setTemplates).catch(() => setError("Vorlagen konnten nicht geladen werden")); }

  function startEdit(tpl: any) {
    setEditId(tpl.id);
    setForm({
      name: tpl.name,
      isDefault: tpl.isDefault,
      steps: (tpl.steps || []).map((s: any) => ({
        name: s.name, sortOrder: s.sortOrder,
        tasks: (s.tasks || []).map((t: any) => ({ title: t.title, description: t.description || "", sortOrder: t.sortOrder }))
      }))
    });
    setShowForm(true);
  }

  function addStep() {
    setForm({ ...form, steps: [...form.steps, { name: "", sortOrder: form.steps.length, tasks: [] }] });
  }

  function removeStep(idx: number) {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== idx) });
  }

  function addTask(stepIdx: number) {
    const steps = [...form.steps];
    steps[stepIdx] = { ...steps[stepIdx], tasks: [...steps[stepIdx].tasks, { title: "", description: "", sortOrder: steps[stepIdx].tasks.length }] };
    setForm({ ...form, steps });
  }

  function removeTask(stepIdx: number, taskIdx: number) {
    const steps = [...form.steps];
    steps[stepIdx] = { ...steps[stepIdx], tasks: steps[stepIdx].tasks.filter((_: any, i: number) => i !== taskIdx) };
    setForm({ ...form, steps });
  }

  function updateStep(idx: number, field: string, value: any) {
    const steps = [...form.steps];
    steps[idx] = { ...steps[idx], [field]: value };
    setForm({ ...form, steps });
  }

  function updateTask(stepIdx: number, taskIdx: number, field: string, value: any) {
    const steps = [...form.steps];
    const tasks = [...steps[stepIdx].tasks];
    tasks[taskIdx] = { ...tasks[taskIdx], [field]: value };
    steps[stepIdx] = { ...steps[stepIdx], tasks };
    setForm({ ...form, steps });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) await api.updateOnboardingTemplate(editId, form);
      else await api.createOnboardingTemplate(form);
      setShowForm(false); setEditId(null);
      setForm({ name: "", isDefault: false, steps: [] });
      setSuccess(editId ? "Vorlage aktualisiert" : "Vorlage erstellt");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch { setError("Fehler beim Speichern"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Onboarding-Vorlage wirklich loeschen?")) return;
    try { await api.deleteOnboardingTemplate(id); load(); } catch { setError("Fehler beim Loeschen"); }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Onboarding-Vorlagen</h1>
        <button onClick={() => { setEditId(null); setForm({ name: "", isDefault: false, steps: [] }); setShowForm(true); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">+ Neue Vorlage</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Name</th><th className="px-4 py-3 text-left text-xs text-muted">Standard</th><th className="px-4 py-3 text-right text-xs text-muted">Schritte</th><th className="px-4 py-3 text-right text-xs text-muted">Aktionen</th></tr></thead>
          <tbody>
            {templates.map((tpl: any) => (
              <tr key={tpl.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium text-sm">{tpl.name}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${tpl.isDefault ? "bg-green-50 text-success" : "bg-gray-100 text-muted"}`}>{tpl.isDefault ? "Ja" : "Nein"}</span></td>
                <td className="px-4 py-3 text-right text-sm">{tpl.steps?.length || 0}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(tpl)} className="text-xs text-primary hover:underline mr-2">Bearbeiten</button>
                  <button onClick={() => handleDelete(tpl.id)} className="text-xs text-danger hover:underline">Loeschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {templates.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Onboarding-Vorlagen vorhanden.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={() => setShowForm(false)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editId ? "Vorlage bearbeiten" : "Neue Onboarding-Vorlage"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-sm font-medium mb-1">Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
                <div className="flex items-end pb-1 gap-2">
                  <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
                  <label htmlFor="isDefault" className="text-sm">Standard-Vorlage</label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Schritte</label>
                  <button type="button" onClick={addStep} className="text-xs text-primary hover:underline">+ Schritt hinzufuegen</button>
                </div>
                <div className="space-y-3">
                  {form.steps.map((step, si) => (
                    <div key={si} className="border border-border rounded-lg p-3">
                      <div className="flex gap-2 items-center mb-2">
                        <input value={step.name} onChange={e => updateStep(si, "name", e.target.value)} placeholder={`Schritt ${si + 1}`} className="flex-1 px-2 py-1 border border-border rounded text-sm" />
                        <input type="number" value={step.sortOrder} onChange={e => updateStep(si, "sortOrder", Number(e.target.value))} className="w-16 px-2 py-1 border border-border rounded text-sm text-center" title="Sortierung" />
                        <button type="button" onClick={() => removeStep(si)} className="text-xs text-danger hover:underline">Entfernen</button>
                      </div>
                      <div className="ml-4 space-y-2">
                        {step.tasks.map((task: any, ti: number) => (
                          <div key={ti} className="flex gap-2 items-center">
                            <input value={task.title} onChange={e => updateTask(si, ti, "title", e.target.value)} placeholder="Aufgabe" className="flex-1 px-2 py-1 border border-border rounded text-sm" />
                            <input value={task.description} onChange={e => updateTask(si, ti, "description", e.target.value)} placeholder="Beschreibung (optional)" className="flex-1 px-2 py-1 border border-border rounded text-sm" />
                            <button type="button" onClick={() => removeTask(si, ti)} className="text-xs text-danger hover:underline">x</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addTask(si)} className="text-xs text-primary hover:underline">+ Aufgabe</button>
                      </div>
                    </div>
                  ))}
                </div>
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
