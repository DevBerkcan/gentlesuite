"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const emptyLine = () => ({ title: "", description: "", quantity: 1, unitPrice: 0, vatPercent: 19, sortOrder: 0 });

export default function InvoicesPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({ customerId: "", subject: "", introText: "", serviceDateFrom: "", serviceDateTo: "", paymentTermDays: 14, taxMode: "Regular" });
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const load = (status = "") => api.invoices(status ? `status=${status}` : "").then(setData).catch(() => setError("Rechnungen konnten nicht geladen werden"));
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    try { const c = await api.customers("pageSize=200"); setCustomers(c.items || []); } catch {}
    setForm({ customerId: "", subject: "", introText: "", serviceDateFrom: "", serviceDateTo: "", paymentTermDays: 14, taxMode: "Regular" });
    setLines([emptyLine()]); setShow(true);
  };

  const updateLine = (idx: number, field: string, val: any) => { const l = [...lines]; (l[idx] as any)[field] = val; setLines(l); };
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  const addLine = () => setLines([...lines, emptyLine()]);
  const netTotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const grossTotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 + l.vatPercent / 100), 0);

  const save = async () => {
    if (!form.customerId) return;
    setSaving(true);
    try {
      const req = {
        customerId: form.customerId, subject: form.subject || undefined, introText: form.introText || undefined,
        serviceDateFrom: form.serviceDateFrom || new Date().toISOString(), serviceDateTo: form.serviceDateTo || new Date().toISOString(),
        paymentTermDays: form.paymentTermDays, taxMode: form.taxMode,
        lines: lines.map((l, i) => ({ ...l, sortOrder: i })),
      };
      const inv = await api.createInvoice(req);
      setShow(false); window.location.href = `/invoices/${inv.id}`;
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Rechnungen</h1>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="Draft">Entwurf</option>
            <option value="Final">Final</option>
            <option value="Open">Offen</option>
            <option value="Overdue">Ueberfaellig</option>
            <option value="Paid">Bezahlt</option>
            <option value="Cancelled">Storniert</option>
          </select>
        </div>
        <button onClick={openModal} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">+ Neue Rechnung</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Nr.</th><th className="px-4 py-3 text-left text-xs text-muted">Kunde</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th><th className="px-4 py-3 text-right text-xs text-muted">Brutto</th><th className="px-4 py-3 text-left text-xs text-muted">Faellig</th><th className="px-4 py-3 text-left text-xs text-muted">PDF</th></tr></thead>
          <tbody>{data?.items?.map((i: any) => (
            <tr key={i.id} className="border-b border-border hover:bg-background cursor-pointer" onClick={() => window.location.href = `/invoices/${i.id}`}>
              <td className="px-4 py-3 font-medium">{i.invoiceNumber}</td>
              <td className="px-4 py-3">{i.customerName}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${i.status === "Paid" ? "bg-green-50 text-success" : i.status === "Overdue" ? "bg-red-50 text-danger" : "bg-yellow-50 text-warning"}`}>{i.status}</span></td>
              <td className="px-4 py-3 text-right font-medium">{i.grossTotal?.toFixed(2)} EUR</td>
              <td className="px-4 py-3 text-sm text-muted">{new Date(i.dueDate).toLocaleDateString("de")}</td>
              <td className="px-4 py-3"><a href={api.invoicePdf(i.id)} target="_blank" className="text-primary text-sm hover:underline" onClick={e => e.stopPropagation()}>PDF</a></td>
            </tr>
          ))}</tbody>
        </table>
        {data?.items?.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Rechnungen vorhanden.</div>}
      </div>

      {show && <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-10 z-50 overflow-auto">
        <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-3xl shadow-xl mb-10">
          <h2 className="text-lg font-bold mb-4">Neue Rechnung erstellen</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted block mb-1">Kunde *</label>
              <select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
                <option value="">Bitte waehlen...</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Betreff</label>
              <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Leistungszeitraum von</label>
              <input type="date" value={form.serviceDateFrom} onChange={e => setForm({...form, serviceDateFrom: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Leistungszeitraum bis</label>
              <input type="date" value={form.serviceDateTo} onChange={e => setForm({...form, serviceDateTo: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Zahlungsfrist (Tage)</label>
              <input type="number" value={form.paymentTermDays} onChange={e => setForm({...form, paymentTermDays: +e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Steuerart</label>
              <select value={form.taxMode} onChange={e => setForm({...form, taxMode: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
                <option value="Regular">Regulaer (MwSt.)</option>
                <option value="SmallBusiness">Kleinunternehmer</option>
                <option value="ReverseCharge">Reverse Charge</option>
              </select>
            </div>
          </div>
          <div className="mb-2">
            <label className="text-xs text-muted block mb-1">Einleitungstext</label>
            <textarea rows={2} value={form.introText} onChange={e => setForm({...form, introText: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>

          <h3 className="font-semibold text-sm mt-4 mb-2">Positionen</h3>
          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {idx === 0 && <label className="text-xs text-muted">Titel</label>}
                  <input value={l.title} onChange={e => updateLine(idx, "title", e.target.value)} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background" placeholder="Titel" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-muted">Menge</label>}
                  <input type="number" step="0.01" value={l.quantity} onChange={e => updateLine(idx, "quantity", +e.target.value)} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-muted">Preis</label>}
                  <input type="number" step="0.01" value={l.unitPrice} onChange={e => updateLine(idx, "unitPrice", +e.target.value)} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-muted">MwSt %</label>}
                  <input type="number" value={l.vatPercent} onChange={e => updateLine(idx, "vatPercent", +e.target.value)} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
                <div className="col-span-1 text-right text-sm font-medium pt-1">{(l.quantity * l.unitPrice).toFixed(2)}</div>
                <div className="col-span-1"><button onClick={() => removeLine(idx)} className="text-danger text-sm hover:underline">x</button></div>
              </div>
            ))}
          </div>
          <button onClick={addLine} className="text-primary text-sm mt-2 hover:underline">+ Position</button>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <div className="text-sm text-muted">Netto: {netTotal.toFixed(2)} EUR | Brutto: {grossTotal.toFixed(2)} EUR</div>
            <div className="flex gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background">Abbrechen</button>
              <button onClick={save} disabled={saving || !form.customerId} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{saving ? "Speichern..." : "Rechnung erstellen"}</button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
