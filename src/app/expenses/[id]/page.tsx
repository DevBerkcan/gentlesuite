"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exp, setExp] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => { if (id) api.expense(id).then(setExp).catch(() => setError("Ausgabe nicht gefunden")); };
  useEffect(() => { load(); api.expenseCategories().then(setCats).catch(() => {}); }, [id]);

  const startEdit = () => {
    setForm({ supplier: exp.supplier, supplierTaxId: exp.supplierTaxId, description: exp.description, netAmount: exp.netAmount, vatPercent: exp.vatPercent, expenseCategoryId: exp.category?.id || "" });
    setEditing(true);
  };

  const saveEdit = async () => {
    try { await api.updateExpense(id, form); setEditing(false); setSuccess("Gespeichert"); setTimeout(() => setSuccess(""), 3000); load(); } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async () => {
    if (!confirm("Ausgabe wirklich loeschen?")) return;
    try { await api.deleteExpense(id); window.location.href = "/expenses"; } catch (e: any) { setError(e.message); }
  };

  const handleBook = async () => {
    try { await api.bookExpense(id); setSuccess("Gebucht"); setTimeout(() => setSuccess(""), 3000); load(); } catch (e: any) { setError(e.message); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { await api.uploadReceipt(id, file); setSuccess("Beleg hochgeladen"); setTimeout(() => setSuccess(""), 3000); load(); } catch (err: any) { setError(err.message); }
  };

  if (error && !exp) return <div className="p-8"><div className="bg-red-50 text-danger px-4 py-2 rounded-lg text-sm">{error}</div></div>;
  if (!exp) return <div className="p-8 text-muted">Laden...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => (window.location.href = "/expenses")} className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Alle Ausgaben</button>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{exp.expenseNumber}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${exp.status === "Booked" ? "bg-green-50 text-success" : "bg-yellow-50 text-warning"}`}>{exp.status === "Booked" ? "Gebucht" : "Entwurf"}</span>
        </div>
        <div className="flex gap-2">
          {exp.status === "Draft" && <>
            <button onClick={startEdit} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background">Bearbeiten</button>
            <button onClick={handleBook} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90">Buchen</button>
            <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-danger border border-danger/30 rounded-lg hover:bg-red-50">Loeschen</button>
          </>}
        </div>
      </div>

      {!editing ? (
        <div className="bg-surface rounded-xl border border-border p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted">Lieferant:</span> <span className="font-medium ml-1">{exp.supplier || "–"}</span></div>
            <div><span className="text-muted">USt-ID Lieferant:</span> <span className="font-medium ml-1">{exp.supplierTaxId || "–"}</span></div>
            <div><span className="text-muted">Kategorie:</span> <span className="font-medium ml-1">{exp.category?.name || "–"}</span></div>
            <div><span className="text-muted">Datum:</span> <span className="font-medium ml-1">{new Date(exp.expenseDate).toLocaleDateString("de")}</span></div>
            <div><span className="text-muted">Netto:</span> <span className="font-medium ml-1">{exp.netAmount?.toFixed(2)} EUR</span></div>
            <div><span className="text-muted">MwSt:</span> <span className="font-medium ml-1">{exp.vatPercent}% ({exp.vatAmount?.toFixed(2)} EUR)</span></div>
            <div><span className="text-muted">Brutto:</span> <span className="font-medium ml-1">{exp.grossAmount?.toFixed(2)} EUR</span></div>
          </div>
          {exp.description && <p className="text-sm mt-4 text-muted">{exp.description}</p>}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-6 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted block mb-1">Lieferant</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs text-muted block mb-1">USt-ID Lieferant</label><input value={form.supplierTaxId || ""} onChange={e => setForm({...form, supplierTaxId: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs text-muted block mb-1">Kategorie</label><select value={form.expenseCategoryId} onChange={e => setForm({...form, expenseCategoryId: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"><option value="">Waehlen...</option>{cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="text-xs text-muted block mb-1">Netto</label><input type="number" step="0.01" value={form.netAmount} onChange={e => setForm({...form, netAmount: +e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs text-muted block mb-1">MwSt %</label><select value={form.vatPercent} onChange={e => setForm({...form, vatPercent: +e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"><option value={19}>19%</option><option value={7}>7%</option><option value={0}>0%</option></select></div>
          </div>
          <div><label className="text-xs text-muted block mb-1">Beschreibung</label><textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div className="flex gap-2"><button onClick={saveEdit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Speichern</button><button onClick={() => setEditing(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button></div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-3">Beleg</h2>
        {exp.receiptPath ? (
          <div>
            {/\.(jpe?g|png|gif|webp)$/i.test(exp.receiptPath) ? (
              <img src={api.receiptUrl(id)} alt="Beleg" className="max-w-full max-h-96 rounded-lg border border-border mb-3" />
            ) : /\.pdf$/i.test(exp.receiptPath) ? (
              <iframe src={api.receiptUrl(id)} className="w-full h-96 rounded-lg border border-border mb-3" />
            ) : null}
            <div className="flex items-center gap-3">
              <a href={api.receiptUrl(id)} target="_blank" className="text-primary text-sm hover:underline">Beleg herunterladen</a>
              <button onClick={() => fileRef.current?.click()} className="text-sm text-muted hover:underline">Ersetzen</button>
            </div>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background">Beleg hochladen</button>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
}
