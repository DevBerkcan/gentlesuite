"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const statusMap: Record<string, { label: string; cls: string }> = {
  Active: { label: "Aktiv", cls: "bg-green-50 text-success" },
  Paused: { label: "Pausiert", cls: "bg-yellow-50 text-warning" },
  Cancelled: { label: "Gekuendigt", cls: "bg-gray-100 text-gray-700" },
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ customerId: "", planId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function loadSubs() {
    api.allSubs().then(setSubs).catch(() => setError("Abonnements konnten nicht geladen werden"));
  }

  useEffect(() => {
    api.plans().then(setPlans).catch(() => {});
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

  const s = (status: string) => statusMap[status] || { label: status, cls: "bg-gray-100 text-gray-700" };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">+ Neues Abonnement</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Plans */}
      {plans.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3">Verfuegbare Plaene</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p: any) => (
              <div key={p.id} className="bg-surface rounded-xl border border-border p-5">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2">{p.monthlyPrice?.toFixed(2)} EUR<span className="text-sm text-muted font-normal"> / Monat</span></p>
                {p.description && <p className="text-sm text-muted mt-2">{p.description}</p>}
                {p.billingCycle && <p className="text-xs text-muted mt-1">Abrechnungszyklus: {p.billingCycle}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

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
                  {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.monthlyPrice?.toFixed(2)} EUR/Monat)</option>)}
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
    </div>
  );
}
