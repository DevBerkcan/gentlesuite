"use client";
import { useState } from "react";
import { api } from "@/lib/api";

const MONTHS = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function VatPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [datevInvoices, setDatevInvoices] = useState(true);
  const [datevExpenses, setDatevExpenses] = useState(true);
  const [datevJournal, setDatevJournal] = useState(true);
  const [elsterDownloading, setElsterDownloading] = useState(false);

  async function loadReport() {
    setLoading(true);
    setError("");
    try {
      const r = await api.vatReport(year, month);
      setReport(r);
    } catch { setError("Bericht konnte nicht geladen werden"); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!confirm(`USt-Voranmeldung fuer ${MONTHS[month - 1]} ${year} wirklich abschliessen? Dies kann nicht rueckgaengig gemacht werden.`)) return;
    try {
      await api.vatSubmit(year, month);
      setSuccess("Zeitraum erfolgreich abgeschlossen");
      setTimeout(() => setSuccess(""), 5000);
      loadReport();
    } catch { setError("Fehler beim Abschliessen"); }
  }

  function handleDatevExport() {
    if (!datevInvoices && !datevExpenses && !datevJournal) { setError("Bitte mindestens eine Export-Option auswaehlen."); return; }
    const token = localStorage.getItem("token");
    const params = `year=${year}&month=${month}&includeInvoices=${datevInvoices}&includeExpenses=${datevExpenses}&includeJournal=${datevJournal}`;
    const url = `${api.vatDatevUrl(year, month).replace(/\?.*/, "")}?${params}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error("Export fehlgeschlagen");
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `DATEV_Export_${year}_${String(month).padStart(2, "0")}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => setError("DATEV-Export fehlgeschlagen"));
  }

  async function handleElsterDownload() {
    setElsterDownloading(true);
    try {
      const blob = await api.vatElsterXml(year, month);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ELSTER_UStVA_${year}_${String(month).padStart(2, "0")}.xml`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { setError("ELSTER-XML-Export fehlgeschlagen"); }
    finally { setElsterDownloading(false); }
  }

  function copyToClipboard(val: number) {
    navigator.clipboard.writeText(val.toFixed(2).replace(".", ","));
  }

  const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " EUR";
  const fmtKz = (n: number) => n.toFixed(2).replace(".", ",");

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">USt-Voranmeldung</h1>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      {/* Period selector */}
      <div className="flex items-end gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Monat</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-2 border border-border rounded-lg">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jahr</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-2 border border-border rounded-lg">
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={loadReport} disabled={loading} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">
          {loading ? "Laden..." : "Bericht laden"}
        </button>
      </div>

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">USt 19%</p>
              <p className="text-lg font-bold">{fmt(report.outputVat19)}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">USt 7%</p>
              <p className="text-lg font-bold">{fmt(report.outputVat7)}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">Umsatzsteuer gesamt</p>
              <p className="text-lg font-bold text-danger">{fmt(report.totalOutputVat)}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">Vorsteuer</p>
              <p className="text-lg font-bold text-success">{fmt(report.inputVat)}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-muted mb-1">Zahllast</p>
              <p className={`text-lg font-bold ${report.payableTax >= 0 ? "text-danger" : "text-success"}`}>{fmt(report.payableTax)}</p>
            </div>
          </div>

          {/* ELSTER Kennzahlen */}
          <section className="bg-surface border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">ELSTER UStVA – Kennzahlen</h2>
                <p className="text-xs text-muted mt-0.5">{MONTHS[month - 1]} {year} · Werte direkt ins ELSTER Online Portal übertragen</p>
              </div>
              <button onClick={handleElsterDownload} disabled={elsterDownloading} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background disabled:opacity-50">
                {elsterDownloading ? "Wird erstellt…" : "ELSTER-XML herunterladen"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {[
                { kz: "81", label: "Lieferungen/Leistungen 19% – Nettobetrag", value: report.netBase19 ?? 0 },
                { kz: "83", label: "Umsatzsteuer 19%", value: report.outputVat19 },
                { kz: "86", label: "Lieferungen/Leistungen 7% – Nettobetrag", value: report.netBase7 ?? 0 },
                { kz: "85", label: "Umsatzsteuer 7%", value: report.outputVat7 },
                { kz: "66", label: "Abziehbare Vorsteuerbeträge", value: report.inputVat },
                report.payableTax >= 0
                  ? { kz: "69", label: "Verbleibende USt-Zahllast", value: report.payableTax }
                  : { kz: "67", label: "Erstattungsbetrag", value: -report.payableTax },
              ].map(({ kz, label, value }) => (
                <div key={kz} className="flex items-center justify-between bg-background rounded-lg px-4 py-2.5 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">KZ {kz}</span>
                    <span className="text-muted truncate">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-medium">{fmtKz(value)}</span>
                    <button onClick={() => copyToClipboard(value)} title="Kopieren" className="text-muted hover:text-text text-xs px-1.5 py-0.5 border border-border rounded hover:bg-surface">
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3">
              → <a href="https://www.elster.de" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">ELSTER Online Portal öffnen</a>
            </p>
          </section>

          {/* Invoice lines */}
          {report.invoiceLines?.length > 0 && (
            <section className="bg-surface rounded-xl border border-border p-6 mb-6">
              <h2 className="font-semibold mb-4">Rechnungen (Umsatzsteuer)</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2">Rechnungs-Nr.</th>
                    <th className="pb-2">Datum</th>
                    <th className="pb-2">Position</th>
                    <th className="pb-2 text-right">Netto</th>
                    <th className="pb-2 text-right">USt</th>
                    <th className="pb-2 text-right">Satz</th>
                  </tr>
                </thead>
                <tbody>
                  {report.invoiceLines.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{l.documentNumber}</td>
                      <td className="py-2">{new Date(l.date).toLocaleDateString("de-DE")}</td>
                      <td className="py-2">{l.description}</td>
                      <td className="py-2 text-right">{fmt(l.netAmount)}</td>
                      <td className="py-2 text-right">{fmt(l.vatAmount)}</td>
                      <td className="py-2 text-right">{l.vatPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Expense lines */}
          {report.expenseLines?.length > 0 && (
            <section className="bg-surface rounded-xl border border-border p-6 mb-6">
              <h2 className="font-semibold mb-4">Ausgaben (Vorsteuer)</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2">Beleg-Nr.</th>
                    <th className="pb-2">Datum</th>
                    <th className="pb-2">Beschreibung</th>
                    <th className="pb-2 text-right">Netto</th>
                    <th className="pb-2 text-right">VSt</th>
                    <th className="pb-2 text-right">Satz</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenseLines.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{l.documentNumber}</td>
                      <td className="py-2">{new Date(l.date).toLocaleDateString("de-DE")}</td>
                      <td className="py-2">{l.description}</td>
                      <td className="py-2 text-right">{fmt(l.netAmount)}</td>
                      <td className="py-2 text-right">{fmt(l.vatAmount)}</td>
                      <td className="py-2 text-right">{l.vatPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {report.invoiceLines?.length === 0 && report.expenseLines?.length === 0 && (
            <div className="bg-surface rounded-xl border border-border p-8 text-center text-muted mb-6">
              Keine Buchungen fuer diesen Zeitraum vorhanden.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={handleSubmit} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">
              Zeitraum abschliessen
            </button>
            <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-muted">DATEV:</span>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={datevInvoices} onChange={e => setDatevInvoices(e.target.checked)} className="accent-primary" />Rechnungen</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={datevExpenses} onChange={e => setDatevExpenses(e.target.checked)} className="accent-primary" />Ausgaben</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={datevJournal} onChange={e => setDatevJournal(e.target.checked)} className="accent-primary" />Journal</label>
              <button onClick={handleDatevExport} className="px-4 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium hover:border-primary ml-1">
                Exportieren
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
