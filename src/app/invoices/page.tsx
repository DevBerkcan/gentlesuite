"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const emptyLine = () => ({ title: "", description: "", quantity: 1, unitPrice: 0, vatPercent: 19, sortOrder: 0 });

const statusMap: Record<string, string> = { Draft: "Entwurf", Sent: "Gesendet", Viewed: "Angesehen", Accepted: "Angenommen", Ordered: "Auftrag", Rejected: "Abgelehnt", Expired: "Abgelaufen" };

export default function InvoicesPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [modalTab, setModalTab] = useState<"quote" | "blank">("quote");
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [form, setForm] = useState({ customerId: "", subject: "", introText: "", serviceDateFrom: "", serviceDateTo: "", paymentTermDays: 14, taxMode: "Regular" });
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [xmlDownloading, setXmlDownloading] = useState<string | null>(null);
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = (status = "", p = 1) => {
    const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    api.invoices(params.toString()).then(setData).catch(() => setError("Rechnungen konnten nicht geladen werden"));
  };
  useEffect(() => { load(); }, []);

  const handleXmlDownload = async (id: string, invoiceNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setXmlDownloading(id);
    try {
      const blob = await api.invoiceXml(id);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `XRechnung_${invoiceNumber}.xml`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { setError("XRechnung-Export fehlgeschlagen."); }
    finally { setXmlDownloading(null); }
  };

  const openModal = async () => {
    setModalTab("quote");
    setShow(true);
    setQuotesLoading(true);
    try {
      const [c, q] = await Promise.all([
        api.customers("pageSize=200"),
        api.quotes("pageSize=200"),
      ]);
      setCustomers(c.items || []);
      setQuotes((q.items || []).filter((qt: any) => !qt.hasInvoice && qt.status !== "Rejected" && qt.status !== "Expired"));
    } catch {}
    setQuotesLoading(false);
    setForm({ customerId: "", subject: "", introText: "", serviceDateFrom: "", serviceDateTo: "", paymentTermDays: 14, taxMode: "Regular" });
    setLines([emptyLine()]);
  };

  const handleConvertQuote = async (quoteId: string) => {
    setConverting(quoteId);
    try {
      const inv = await api.convertQuoteToInvoice(quoteId);
      setShow(false);
      window.location.href = `/invoices/${inv.id}`;
    } catch (e: any) { setError(e.message || "Fehler beim Umwandeln."); }
    finally { setConverting(null); }
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

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => { const ids = data?.items?.map((i: any) => i.id) || []; setSelected(s => s.size === ids.length ? new Set() : new Set(ids)); };

  const handleBulkFinalize = async () => {
    if (!selected.size || !confirm(`${selected.size} Rechnungen finalisieren?`)) return;
    setBulkBusy(true);
    try { await api.bulkFinalizeInvoices(Array.from(selected)); setSelected(new Set()); setSuccess(`${selected.size} Rechnungen finalisiert.`); setTimeout(() => setSuccess(""), 4000); load(statusFilter, page); }
    catch { setError("Fehler beim Finalisieren."); } finally { setBulkBusy(false); }
  };

  const handleBulkSend = async () => {
    if (!selected.size || !confirm(`${selected.size} Rechnungen per E-Mail senden?`)) return;
    setBulkBusy(true);
    try { await api.bulkSendInvoices(Array.from(selected)); setSelected(new Set()); setSuccess(`${selected.size} Rechnungen gesendet.`); setTimeout(() => setSuccess(""), 4000); load(statusFilter, page); }
    catch { setError("Fehler beim Senden."); } finally { setBulkBusy(false); }
  };

  const handleReminder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Mahnungs-E-Mail an den Kunden senden?")) return;
    setReminderSending(id);
    try {
      await api.sendInvoiceReminder(id);
      setSuccess("Mahnung wurde gesendet."); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Mahnung konnte nicht gesendet werden."); }
    finally { setReminderSending(null); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Rechnungen</h1>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); load(e.target.value, 1); }} className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="Draft">Entwurf</option>
            <option value="Final">Final</option>
            <option value="Open">Offen</option>
            <option value="Overdue">Ueberfaellig</option>
            <option value="Paid">Bezahlt</option>
            <option value="Cancelled">Storniert</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted">{selected.size} ausgewählt</span>
              <button onClick={handleBulkFinalize} disabled={bulkBusy} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-50">Finalisieren</button>
              <button onClick={handleBulkSend} disabled={bulkBusy} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-50">Senden</button>
            </>
          )}
          <a href={api.exportInvoicesCsv(statusFilter || undefined)} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background">CSV Export</a>
          <button onClick={openModal} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">+ Neue Rechnung</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 w-8"><input type="checkbox" onChange={toggleAll} checked={!!data?.items?.length && selected.size === data.items.length} className="accent-primary" /></th><th className="px-4 py-3 text-left text-xs text-muted">Nr.</th><th className="px-4 py-3 text-left text-xs text-muted">Kunde</th><th className="px-4 py-3 text-left text-xs text-muted">Status</th><th className="px-4 py-3 text-right text-xs text-muted">Brutto</th><th className="px-4 py-3 text-left text-xs text-muted">Faellig</th><th className="px-4 py-3 text-left text-xs text-muted">Dokumente</th></tr></thead>
          <tbody>{data?.items?.map((i: any) => (
            <tr key={i.id} className={`border-b border-border hover:bg-background cursor-pointer ${selected.has(i.id) ? "bg-primary/5" : ""}`} onClick={() => window.location.href = `/invoices/${i.id}`}>
              <td className="px-4 py-3 w-8" onClick={e => { e.stopPropagation(); toggleSelect(i.id); }}><input type="checkbox" checked={selected.has(i.id)} onChange={() => {}} className="accent-primary" /></td>
              <td className="px-4 py-3 font-medium">{i.invoiceNumber}</td>
              <td className="px-4 py-3">{i.customerName}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${i.status === "Paid" ? "bg-green-50 text-success" : i.status === "Overdue" ? "bg-red-50 text-danger" : "bg-yellow-50 text-warning"}`}>{i.status}</span></td>
              <td className="px-4 py-3 text-right font-medium">{i.grossTotal?.toFixed(2)} EUR</td>
              <td className="px-4 py-3 text-sm text-muted">{new Date(i.dueDate).toLocaleDateString("de")}</td>
              <td className="px-4 py-3 flex items-center gap-3">
                <a href={api.invoicePdf(i.id)} target="_blank" className="text-primary text-sm hover:underline" onClick={e => e.stopPropagation()}>PDF</a>
                {i.status !== "Draft" && (
                  <button onClick={e => handleXmlDownload(i.id, i.invoiceNumber, e)} disabled={xmlDownloading === i.id} className="text-sm text-muted hover:text-text disabled:opacity-50">
                    {xmlDownloading === i.id ? "…" : "XML"}
                  </button>
                )}
                {(i.status === "Overdue" || i.status === "Open" || i.status === "Sent") && (
                  <button onClick={e => handleReminder(i.id, e)} disabled={reminderSending === i.id} className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 disabled:opacity-50">
                    {reminderSending === i.id ? "…" : "Mahnung"}
                  </button>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table>
        {data?.items?.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Rechnungen vorhanden.</div>}
      </div>
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted">{data.totalCount} Rechnungen gesamt</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(statusFilter, p); }} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40">← Zurück</button>
            <span className="text-sm text-muted">Seite {page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => { const p = page + 1; setPage(p); load(statusFilter, p); }} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40">Weiter →</button>
          </div>
        </div>
      )}

      {show && <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-10 z-50 overflow-auto">
        <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-3xl shadow-xl mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Neue Rechnung erstellen</h2>
            <button onClick={() => setShow(false)} className="text-muted hover:text-text text-xl leading-none">×</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-background rounded-lg p-1 border border-border">
            <button onClick={() => setModalTab("quote")} className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${modalTab === "quote" ? "bg-surface shadow-sm text-text" : "text-muted hover:text-text"}`}>
              Aus Angebot übernehmen
            </button>
            <button onClick={() => setModalTab("blank")} className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${modalTab === "blank" ? "bg-surface shadow-sm text-text" : "text-muted hover:text-text"}`}>
              Neue leere Rechnung
            </button>
          </div>

          {/* Tab: Aus Angebot */}
          {modalTab === "quote" && (
            <div>
              {quotesLoading ? (
                <div className="py-10 text-center text-muted text-sm">Angebote werden geladen...</div>
              ) : quotes.length === 0 ? (
                <div className="py-10 text-center text-muted text-sm">
                  <p className="font-medium mb-1">Keine offenen Angebote</p>
                  <p className="text-xs">Alle Angebote wurden bereits in Rechnungen umgewandelt, oder es gibt noch keine Angebote.</p>
                  <button onClick={() => setModalTab("blank")} className="mt-4 text-primary text-sm hover:underline">→ Leere Rechnung erstellen</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted mb-3">{quotes.length} Angebot{quotes.length !== 1 ? "e" : ""} ohne Rechnung — Klicken um direkt zu übernehmen</p>
                  {quotes.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{q.quoteNumber}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted">{statusMap[q.status] ?? q.status}</span>
                        </div>
                        <div className="text-sm text-muted mt-0.5">{q.customerName}{q.subject ? <span className="ml-2">· {q.subject}</span> : null}</div>
                      </div>
                      <div className="flex items-center gap-4 ml-4 shrink-0">
                        <span className="text-sm font-semibold">{q.grandTotal?.toFixed(2)} €</span>
                        <button
                          onClick={() => handleConvertQuote(q.id)}
                          disabled={converting === q.id}
                          className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                        >
                          {converting === q.id ? "…" : "→ Zu Rechnung"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Neue leere Rechnung */}
          {modalTab === "blank" && (
            <>
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
            </>
          )}
        </div>
      </div>}
    </div>
  );
}
