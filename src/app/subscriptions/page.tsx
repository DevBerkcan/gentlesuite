"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const statusMap: Record<string, { label: string; cls: string }> = {
  Active: { label: "Aktiv", cls: "bg-green-50 text-success" },
  Paused: { label: "Pausiert", cls: "bg-yellow-50 text-warning" },
  Cancelled: { label: "Gekuendigt", cls: "bg-gray-100 text-gray-700" },
};

const categoryMap: Record<string, string> = {
  Allgemein: "Allgemein",
  DomainHosting: "Domain-Hosting",
  Wartungsvertrag: "Wartungsvertrag",
  SLA: "SLA",
  Software: "Software",
  Support: "Support",
  Sonstiges: "Sonstiges",
};

const cycleMap: Record<string, string> = {
  Monthly: "Monatlich",
  Quarterly: "Quartalsmässig",
  Yearly: "Jährlich",
};

const CATEGORIES = ["Allgemein", "DomainHosting", "Wartungsvertrag", "SLA", "Software", "Support", "Sonstiges"];
const CYCLES = ["Monthly", "Quarterly", "Yearly"];

const emptyPlanForm = { name: "", description: "", monthlyPrice: "", billingCycle: "Monthly", category: "Allgemein", isActive: true };

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ customerId: "", planId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Plan CRUD state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ ...emptyPlanForm });
  const [planLoading, setPlanLoading] = useState(false);

  function loadPlans() {
    api.plans().then(setPlans).catch(() => {});
  }

  function loadSubs() {
    api.allSubs().then(setSubs).catch(() => setError("Abonnements konnten nicht geladen werden"));
  }

  useEffect(() => {
    loadPlans();
    loadSubs();
    api.customers().then((r: any) => setCustomers(r.items || [])).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createSub(form);
      setShowNew(false);
      setForm({ customerId: "", planId: "" });
      setError("");
      setSuccess("Abonnement erfolgreich angelegt");
      setTimeout(() => setSuccess(""), 4000);
      loadSubs();
    } catch {
      setError("Fehler beim Anlegen des Abonnements");
    }
  }

  async function handleStatus(id: string, status: string) {
    try {
      await api.updateSubStatus(id, { status });
      setSuccess(`Status auf "${statusMap[status]?.label || status}" geaendert`);
      setTimeout(() => setSuccess(""), 4000);
      loadSubs();
    } catch {
      setError("Fehler beim Aendern des Status");
    }
  }

  function openNewPlan() {
    setEditingPlan(null);
    setPlanForm({ ...emptyPlanForm });
    setShowPlanModal(true);
  }

  function openEditPlan(plan: any) {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || "",
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice?.toString() || "",
      billingCycle: plan.billingCycle || "Monthly",
      category: plan.category || "Allgemein",
      isActive: plan.isActive !== false,
    });
    setShowPlanModal(true);
  }

  async function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlanLoading(true);
    try {
      const payload = {
        name: planForm.name,
        description: planForm.description || null,
        monthlyPrice: parseFloat(planForm.monthlyPrice),
        billingCycle: planForm.billingCycle,
        category: planForm.category,
        isActive: planForm.isActive,
      };
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
        setSuccess("Plan erfolgreich aktualisiert");
      } else {
        await api.createPlan(payload);
        setSuccess("Plan erfolgreich angelegt");
      }
      setTimeout(() => setSuccess(""), 4000);
      setShowPlanModal(false);
      loadPlans();
    } catch {
      setError("Fehler beim Speichern des Plans");
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleDeletePlan(plan: any) {
    if (!confirm(`Plan "${plan.name}" wirklich löschen?`)) return;
    try {
      await api.deletePlan(plan.id);
      setSuccess("Plan gelöscht");
      setTimeout(() => setSuccess(""), 4000);
      loadPlans();
    } catch {
      setError("Fehler beim Löschen des Plans");
    }
  }

  const s = (status: string) => statusMap[status] || { label: status, cls: "bg-gray-100 text-gray-700" };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">+ Neues Abonnement</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Plans Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Pläne verwalten</h2>
          <button onClick={openNewPlan} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors">+ Neuer Plan</button>
        </div>
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left text-xs text-muted">Name</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Kategorie</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Preis / Monat</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Zyklus</th>
                <th className="px-4 py-3 text-left text-xs text-muted">Status</th>
                <th className="px-4 py-3 text-right text-xs text-muted">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p: any) => (
                <tr key={p.id} className="border-b border-border hover:bg-background">
                  <td className="px-4 py-3 font-medium">
                    {p.name}
                    {p.description && <div className="text-xs text-muted">{p.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm">{categoryMap[p.category] || p.category || "Allgemein"}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{p.monthlyPrice?.toFixed(2)} EUR</td>
                  <td className="px-4 py-3 text-sm">{cycleMap[p.billingCycle] || p.billingCycle}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.isActive !== false ? "bg-green-50 text-success" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive !== false ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => openEditPlan(p)} className="text-xs text-primary hover:underline">Bearbeiten</button>
                      <button onClick={() => handleDeletePlan(p)} className="text-xs text-danger hover:underline">Löschen</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Pläne vorhanden. Legen Sie einen neuen Plan an.</div>}
        </div>
      </div>

      {/* Active Subscriptions */}
      <h2 className="font-semibold mb-3">Aktive Abonnements</h2>
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left text-xs text-muted">Kunde</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Plan</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Status</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Start</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Naechste Abrechnung</th>
              <th className="px-4 py-3 text-right text-xs text-muted">Preis/Monat</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((sub: any) => (
              <tr key={sub.id} className="border-b border-border hover:bg-background">
                <td className="px-4 py-3 font-medium">{sub.customerName || "–"}</td>
                <td className="px-4 py-3">{sub.planName}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${s(sub.status).cls}`}>{s(sub.status).label}</span></td>
                <td className="px-4 py-3 text-sm text-muted">{new Date(sub.startDate).toLocaleDateString("de")}</td>
                <td className="px-4 py-3 text-sm text-muted">{new Date(sub.nextBillingDate).toLocaleDateString("de")}</td>
                <td className="px-4 py-3 text-right font-medium">{sub.monthlyPrice?.toFixed(2)} EUR</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {sub.status === "Active" && (
                      <button onClick={() => handleStatus(sub.id, "Paused")} className="text-xs text-warning hover:underline">Pausieren</button>
                    )}
                    {sub.status === "Paused" && (
                      <button onClick={() => handleStatus(sub.id, "Active")} className="text-xs text-success hover:underline">Aktivieren</button>
                    )}
                    {sub.status !== "Cancelled" && (
                      <button onClick={() => handleStatus(sub.id, "Cancelled")} className="text-xs text-danger hover:underline">Kuendigen</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subs.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Abonnements vorhanden.</div>}
      </div>

      {/* New Subscription Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-surface rounded-xl border border-border p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Neues Abonnement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Kunde *</label>
                <select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Bitte waehlen...</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Plan *</label>
                <select required value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Bitte waehlen...</option>
                  {plans.filter((p: any) => p.isActive !== false).map((p: any) => <option key={p.id} value={p.id}>{p.name} — {categoryMap[p.category] || p.category} ({p.monthlyPrice?.toFixed(2)} EUR/Monat)</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">Abbrechen</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">Anlegen</button>
            </div>
          </form>
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handlePlanSubmit} className="bg-surface rounded-xl border border-border p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">{editingPlan ? "Plan bearbeiten" : "Neuer Plan"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Name *</label>
                <input required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="z.B. Domain-Hosting Basic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Beschreibung</label>
                <textarea value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Optionale Beschreibung..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Preis (EUR/Monat) *</label>
                  <input required type="number" step="0.01" min="0" value={planForm.monthlyPrice} onChange={e => setPlanForm({ ...planForm, monthlyPrice: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="9.99" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Abrechnungszyklus</label>
                  <select value={planForm.billingCycle} onChange={e => setPlanForm({ ...planForm, billingCycle: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {CYCLES.map(c => <option key={c} value={c}>{cycleMap[c]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Kategorie</label>
                <select value={planForm.category} onChange={e => setPlanForm({ ...planForm, category: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryMap[c]}</option>)}
                </select>
              </div>
              {editingPlan && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="planActive" checked={planForm.isActive} onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })} className="w-4 h-4 accent-primary" />
                  <label htmlFor="planActive" className="text-sm font-medium text-text">Plan aktiv (erscheint in Auswahl)</label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowPlanModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">Abbrechen</button>
              <button type="submit" disabled={planLoading} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50">
                {planLoading ? "Speichern..." : editingPlan ? "Aktualisieren" : "Anlegen"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
