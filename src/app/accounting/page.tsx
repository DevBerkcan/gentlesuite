"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Tab = "journal" | "accounts" | "bank";

export default function AccountingPage() {
  const [tab, setTab] = useState<Tab>("journal");
  const [journal, setJournal] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bank, setBank] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ bookingDate: new Date().toISOString().slice(0, 10), description: "", reference: "", lines: [{ accountNumber: "", accountName: "", isDebit: true, amount: 0, note: "" }, { accountNumber: "", accountName: "", isDebit: false, amount: 0, note: "" }] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Journal filters
  const [jSearch, setJSearch] = useState("");
  const [jFrom, setJFrom] = useState("");
  const [jTo, setJTo] = useState("");
  const [jStatus, setJStatus] = useState("");

  useEffect(() => { loadJournal(); api.chartOfAccounts().then(setAccounts).catch(() => {}); loadBank(); }, []);

  function loadJournal() { api.journalEntries().then(setJournal).catch(() => setError("Buchungen konnten nicht geladen werden")); }
  function loadBank() { api.bankTransactions().then(setBank).catch(() => {}); }

  function addLine() { setForm({ ...form, lines: [...form.lines, { accountNumber: "", accountName: "", isDebit: true, amount: 0, note: "" }] }); }
  function removeLine(idx: number) { setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) }); }
  function updateLine(idx: number, field: string, value: any) { const lines = [...form.lines]; lines[idx] = { ...lines[idx], [field]: value }; setForm({ ...form, lines }); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createJournalEntry({ bookingDate: form.bookingDate, description: form.description, reference: form.reference, lines: form.lines });
      setShowNew(false);
      setForm({ bookingDate: new Date().toISOString().slice(0, 10), description: "", reference: "", lines: [{ accountNumber: "", accountName: "", isDebit: true, amount: 0, note: "" }, { accountNumber: "", accountName: "", isDebit: false, amount: 0, note: "" }] });
      setSuccess("Buchung erstellt");
      setTimeout(() => setSuccess(""), 3000);
      loadJournal();
    } catch { setError("Fehler beim Erstellen"); }
  }

  async function handlePost(id: string) {
    try { await api.postJournalEntry(id); setSuccess("Buchung gebucht"); setTimeout(() => setSuccess(""), 3000); loadJournal(); } catch (e: any) { setError(e.message || "Fehler beim Buchen"); }
  }

  async function handleMatch(id: string, invoiceId?: string, expenseId?: string) {
    try { await api.matchBankTransaction(id, { invoiceId: invoiceId || null, expenseId: expenseId || null }); setSuccess("Transaktion zugeordnet"); setTimeout(() => setSuccess(""), 3000); loadBank(); } catch { setError("Fehler bei der Zuordnung"); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "journal", label: "Buchungen" },
    { key: "accounts", label: "Kontenplan" },
    { key: "bank", label: "Banktransaktionen" },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Buchhaltung</h1>
        {tab === "journal" && <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">+ Buchung</button>}
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="flex gap-1 mb-6 bg-background rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? "bg-surface shadow-sm text-text" : "text-muted hover:text-text"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "journal" && (
        <>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input placeholder="Suche..." value={jSearch} onChange={e => setJSearch(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm w-48" />
          <input type="date" value={jFrom} onChange={e => setJFrom(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
          <span className="text-sm text-muted">bis</span>
          <input type="date" value={jTo} onChange={e => setJTo(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
          <select value={jStatus} onChange={e => setJStatus(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="Draft">Entwurf</option>
            <option value="Posted">Gebucht</option>
          </select>
          {(jSearch || jFrom || jTo || jStatus) && <button onClick={() => { setJSearch(""); setJFrom(""); setJTo(""); setJStatus(""); }} className="text-xs text-muted hover:text-text underline">Zuruecksetzen</button>}
        </div>
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {(() => {
            const filtered = (journal?.items || []).filter((j: any) => {
              if (jStatus && j.status !== jStatus) return false;
              if (jFrom && new Date(j.bookingDate) < new Date(jFrom)) return false;
              if (jTo && new Date(j.bookingDate) > new Date(jTo)) return false;
              if (jSearch) {
                const q = jSearch.toLowerCase();
                if (!j.description?.toLowerCase().includes(q) && !j.reference?.toLowerCase().includes(q) && !j.entryNumber?.toLowerCase().includes(q)) return false;
              }
              return true;
            });
            return (
          <table className="w-full">
            <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Nr.</th><th className="px-4 py-3 text-left text-xs text-muted">Datum</th><th className="px-4 py-3 text-left text-xs text-muted">Beschreibung</th><th className="px-4 py-3 text-left text-xs text-muted">Referenz</th><th className="px-4 py-3 text-right text-xs text-muted">Soll</th><th className="px-4 py-3 text-right text-xs text-muted">Haben</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th><th className="px-4 py-3 text-right text-xs text-muted">Aktionen</th></tr></thead>
            <tbody>
              {filtered.map((j: any) => (
                <tr key={j.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-sm">{j.entryNumber}</td>
                  <td className="px-4 py-3 text-sm">{new Date(j.bookingDate).toLocaleDateString("de")}</td>
                  <td className="px-4 py-3 text-sm">{j.description || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted">{j.reference || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right">{j.totalDebit?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">{j.totalCredit?.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${j.status === "Posted" ? "bg-green-50 text-success" : "bg-gray-100 text-muted"}`}>{j.status === "Posted" ? "Gebucht" : "Entwurf"}</span></td>
                  <td className="px-4 py-3 text-right">{j.status === "Draft" && j.isBalanced && <button onClick={() => handlePost(j.id)} className="text-xs text-primary hover:underline">Buchen</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
            );
          })()}
          {(!journal?.items || journal.items.length === 0) && <div className="p-8 text-center text-muted text-sm">Keine Buchungen vorhanden.</div>}
        </div>
        </>
      )}

      {tab === "accounts" && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Kontonummer</th><th className="px-4 py-3 text-left text-xs text-muted">Name</th><th className="px-4 py-3 text-left text-xs text-muted">Typ</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th></tr></thead>
            <tbody>
              {accounts.map((a: any) => (
                <tr key={a.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-sm">{a.accountNumber}</td>
                  <td className="px-4 py-3 text-sm">{a.name}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${a.type === "Income" ? "bg-green-50 text-success" : a.type === "Expense" ? "bg-red-50 text-danger" : "bg-gray-100 text-muted"}`}>{a.type}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs ${a.isActive ? "text-success" : "text-muted"}`}>{a.isActive ? "Aktiv" : "Inaktiv"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <div className="p-8 text-center text-muted text-sm">Kein Kontenplan vorhanden.</div>}
        </div>
      )}

      {tab === "bank" && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Datum</th><th className="px-4 py-3 text-left text-xs text-muted">Beschreibung</th><th className="px-4 py-3 text-right text-xs text-muted">Betrag</th><th className="px-4 py-3 text-left text-xs text-muted">Sender/Empfaenger</th><th className="px-4 py-3 text-left text-xs text-muted">Referenz</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th></tr></thead>
            <tbody>
              {bank?.items?.map((t: any) => (
                <tr key={t.id} className="border-b border-border">
                  <td className="px-4 py-3 text-sm">{new Date(t.transactionDate).toLocaleDateString("de")}</td>
                  <td className="px-4 py-3 text-sm">{t.description || "—"}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${t.amount >= 0 ? "text-success" : "text-danger"}`}>{t.amount?.toFixed(2)} EUR</td>
                  <td className="px-4 py-3 text-sm">{t.amount >= 0 ? t.sender : t.recipient || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted">{t.reference || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${t.status === "Matched" ? "bg-green-50 text-success" : t.status === "Ignored" ? "bg-gray-100 text-muted" : "bg-yellow-50 text-warning"}`}>{t.status === "Matched" ? "Zugeordnet" : t.status === "Ignored" ? "Ignoriert" : "Offen"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!bank?.items || bank.items.length === 0) && <div className="p-8 text-center text-muted text-sm">Keine Banktransaktionen vorhanden.</div>}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Neue Buchung</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium mb-1">Datum *</label><input required type="date" value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Beschreibung</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Referenz</label><input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Buchungszeilen</label>
                {form.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div className="col-span-2"><input placeholder="Konto-Nr." value={line.accountNumber} onChange={e => updateLine(idx, "accountNumber", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
                    <div className="col-span-3"><input placeholder="Kontoname" value={line.accountName} onChange={e => updateLine(idx, "accountName", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
                    <div className="col-span-2"><select value={line.isDebit ? "debit" : "credit"} onChange={e => updateLine(idx, "isDebit", e.target.value === "debit")} className="w-full px-2 py-1.5 border border-border rounded text-sm"><option value="debit">Soll</option><option value="credit">Haben</option></select></div>
                    <div className="col-span-2"><input type="number" step="0.01" placeholder="Betrag" value={line.amount || ""} onChange={e => updateLine(idx, "amount", Number(e.target.value))} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
                    <div className="col-span-2"><input placeholder="Notiz" value={line.note} onChange={e => updateLine(idx, "note", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
                    <div className="col-span-1"><button type="button" onClick={() => removeLine(idx)} className="px-2 py-1.5 text-danger text-sm hover:bg-red-50 rounded">x</button></div>
                  </div>
                ))}
                <button type="button" onClick={addLine} className="px-3 py-1.5 border border-dashed border-border rounded-lg text-sm text-muted hover:text-text">+ Zeile</button>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Erstellen</button>
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
