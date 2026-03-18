"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const defaultForm = { supplier: "", description: "", netAmount: 0, vatPercent: 19, expenseCategoryId: "", isRecurring: false, recurringInterval: "Monthly", recurringNextDate: "" };

export default function ExpensesPage() {
  const [data, setData] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm, clearForm] = useLocalStorage("draft:expense-create", defaultForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Category management
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "", accountCode: "" });
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const loadCats = () => api.expenseCategories().then(setCats).catch(() => {});

  const loadExpenses = (p = 1) => api.expenses(`page=${p}&pageSize=${pageSize}`).then(setData).catch(() => setError("Ausgaben konnten nicht geladen werden"));

  useEffect(() => {
    loadExpenses();
    loadCats();
  }, []);

  async function handleSaveCat(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editCatId) await api.updateExpenseCategory(editCatId, catForm);
      else await api.createExpenseCategory(catForm);
      setCatForm({ name: "", description: "", accountCode: "" });
      setEditCatId(null);
      loadCats();
    } catch { setError("Fehler beim Speichern der Kategorie"); }
  }

  async function handleDeleteCat(catId: string) {
    if (!confirm("Kategorie wirklich loeschen?")) return;
    try { await api.deleteExpenseCategory(catId); loadCats(); } catch { setError("Fehler beim Loeschen"); }
  }

  function startEditCat(c: any) {
    setEditCatId(c.id);
    setCatForm({ name: c.name, description: c.description || "", accountCode: c.accountCode || "" });
  }

  const filteredItems = (data?.items || []).filter((e: any) => {
    if (statusFilter === "booked" && !e.isBooked) return false;
    if (statusFilter === "draft" && e.isBooked) return false;
    if (catFilter && e.categoryName !== catFilter) return false;
    return true;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.netAmount < 0) nextErrors.netAmount = "Nettobetrag darf nicht negativ sein.";
    if (form.vatPercent < 0 || form.vatPercent > 100) nextErrors.vatPercent = "MwSt muss zwischen 0 und 100 liegen.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await api.createExpense(form);
      setShowNew(false);
      clearForm();
      setFieldErrors({});
      setError("");
      setSuccess("Ausgabe erfolgreich erfasst");
      setTimeout(() => setSuccess(""), 4000);
      loadExpenses(page);
    } catch (e: any) { setError(e?.message || "Fehler beim Erfassen der Ausgabe"); }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Ausgaben</h1>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="booked">Gebucht</option>
          </select>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Kategorien</option>
            {cats.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={() => setShowCatMgr(true)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background">Kategorien</button>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">+ Neue Ausgabe</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Nr.</th><th className="px-4 py-3 text-left text-xs text-muted">Lieferant</th><th className="px-4 py-3 text-left text-xs text-muted">Kategorie</th><th className="px-4 py-3 text-right text-xs text-muted">Brutto</th><th className="px-4 py-3 text-left text-xs text-muted">Datum</th></tr></thead>
          <tbody>{filteredItems.map((e: any) => (
            <tr key={e.id} className="border-b border-border hover:bg-background cursor-pointer" onClick={() => window.location.href = `/expenses/${e.id}`}><td className="px-4 py-3">{e.expenseNumber}</td><td className="px-4 py-3 flex items-center gap-2">{e.supplier}{e.isRecurring && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Wiederkehrend</span>}</td><td className="px-4 py-3 text-sm text-muted">{e.categoryName}</td><td className="px-4 py-3 text-right font-medium">{e.grossAmount?.toFixed(2)} EUR</td><td className="px-4 py-3 text-sm text-muted">{new Date(e.expenseDate).toLocaleDateString("de")}</td></tr>
          ))}</tbody>
        </table>
        {filteredItems.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Ausgaben vorhanden.</div>}
      </div>
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted">{data.totalCount} Ausgaben gesamt</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadExpenses(p); }} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40">← Zurück</button>
            <span className="text-sm text-muted">Seite {page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => { const p = page + 1; setPage(p); loadExpenses(p); }} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40">Weiter →</button>
          </div>
        </div>
      )}
      {showCatMgr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowCatMgr(false); setEditCatId(null); setCatForm({ name: "", description: "", accountCode: "" }); }}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ausgaben-Kategorien</h2>
            <form onSubmit={handleSaveCat} className="flex gap-2 mb-5">
              <input required placeholder="Name *" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
              <input placeholder="Kontonr." value={catForm.accountCode} onChange={e => setCatForm({ ...catForm, accountCode: e.target.value })} className="w-28 px-3 py-2 border border-border rounded-lg text-sm" />
              <input placeholder="Beschreibung" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
              <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium">{editCatId ? "Speichern" : "+ Neu"}</button>
              {editCatId && <button type="button" onClick={() => { setEditCatId(null); setCatForm({ name: "", description: "", accountCode: "" }); }} className="px-3 py-2 border border-border rounded-lg text-sm">Abbrechen</button>}
            </form>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              {cats.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">Keine Kategorien vorhanden</div>
              ) : (
                <table className="w-full">
                  <thead><tr className="border-b border-border"><th className="px-4 py-2 text-left text-xs text-muted">Name</th><th className="px-4 py-2 text-left text-xs text-muted">Konto</th><th className="px-4 py-2 text-left text-xs text-muted">Beschreibung</th><th className="px-4 py-2 text-right text-xs text-muted">Aktionen</th></tr></thead>
                  <tbody>
                    {cats.map((c: any) => (
                      <tr key={c.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2 text-sm font-medium">{c.name}</td>
                        <td className="px-4 py-2 text-sm text-muted">{c.accountCode || "—"}</td>
                        <td className="px-4 py-2 text-sm text-muted">{c.description || "—"}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => startEditCat(c)} className="text-xs text-primary hover:underline mr-2">Bearbeiten</button>
                          <button onClick={() => handleDeleteCat(c.id)} className="text-xs text-danger hover:underline">Loeschen</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setShowCatMgr(false); setEditCatId(null); setCatForm({ name: "", description: "", accountCode: "" }); }} className="px-4 py-2 border border-border rounded-lg text-sm">Schliessen</button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Neue Ausgabe</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Lieferant</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Kategorie</label><select value={form.expenseCategoryId} onChange={e => setForm({...form, expenseCategoryId: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg"><option value="">Waehlen...</option>{cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div>
                <label className="block text-sm font-medium mb-1">Nettobetrag</label>
                <input type="number" step="0.01" value={form.netAmount} onChange={e => { setForm({...form, netAmount: +e.target.value}); setFieldErrors(prev => ({ ...prev, netAmount: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg" />
                {fieldErrors.netAmount && <p className="text-xs text-danger mt-1">{fieldErrors.netAmount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MwSt %</label>
                <select value={form.vatPercent} onChange={e => { setForm({...form, vatPercent: +e.target.value}); setFieldErrors(prev => ({ ...prev, vatPercent: "" })); }} className="w-full px-3 py-2 border border-border rounded-lg"><option value={19}>19%</option><option value={7}>7%</option><option value={0}>0%</option></select>
                {fieldErrors.vatPercent && <p className="text-xs text-danger mt-1">{fieldErrors.vatPercent}</p>}
              </div>
              <div><label className="block text-sm font-medium mb-1">Beschreibung</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg" /></div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({...form, isRecurring: e.target.checked})} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Wiederkehrende Ausgabe</span>
                </label>
              </div>
              {form.isRecurring && (
                <div className="grid grid-cols-2 gap-3 bg-blue-50 rounded-lg p-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Intervall</label>
                    <select value={form.recurringInterval} onChange={e => setForm({...form, recurringInterval: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                      <option value="Monthly">Monatlich</option>
                      <option value="Quarterly">Quartalsweise</option>
                      <option value="Yearly">Jährlich</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Nächste Ausführung</label>
                    <input type="date" value={form.recurringNextDate} onChange={e => setForm({...form, recurringNextDate: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                  </div>
                </div>
              )}
              <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Speichern</button><button type="button" onClick={() => { setShowNew(false); setFieldErrors({}); }} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
