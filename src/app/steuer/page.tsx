"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Download, FileText, Receipt, Archive, ChevronRight } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

type Stats = {
  year: number;
  invoiceCount: number;
  invoiceGrossTotal: number;
  expenseCount: number;
  expenseGrossTotal: number;
  expensesWithReceipt: number;
};

export default function SteuerPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [inclInvoices, setInclInvoices] = useState(true);
  const [inclExpenses, setInclExpenses] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStats(null);
    setLoadingStats(true);
    api.exportYearStats(year)
      .then(setStats)
      .catch(() => setError("Statistiken konnten nicht geladen werden."))
      .finally(() => setLoadingStats(false));
  }, [year]);

  async function handleDownload() {
    if (!inclInvoices && !inclExpenses) {
      setError("Bitte mindestens eine Option auswählen.");
      return;
    }
    setError("");
    setDownloading(true);
    try {
      const blob = await api.exportYearZip(year, inclInvoices, inclExpenses);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Steuerunterlagen_${year}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("Export fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setDownloading(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Steuerbereich</h1>
          <p className="text-muted text-sm mt-1">Jahresexport für Steuerberater, DATEV und Lexware</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted">Jahr:</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-danger/10 text-danger px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <FileText className="w-4 h-4" />Rechnungen
          </div>
          {loadingStats ? (
            <div className="h-8 bg-background animate-pulse rounded w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold">{stats?.invoiceCount ?? 0}</p>
              <p className="text-sm text-muted mt-1">{stats ? fmt(stats.invoiceGrossTotal) : "0,00"} € brutto</p>
            </>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <Receipt className="w-4 h-4" />Ausgaben
          </div>
          {loadingStats ? (
            <div className="h-8 bg-background animate-pulse rounded w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold">{stats?.expenseCount ?? 0}</p>
              <p className="text-sm text-muted mt-1">{stats ? fmt(stats.expenseGrossTotal) : "0,00"} € brutto</p>
            </>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <Archive className="w-4 h-4" />Belege vorhanden
          </div>
          {loadingStats ? (
            <div className="h-8 bg-background animate-pulse rounded w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold">{stats?.expensesWithReceipt ?? 0}</p>
              <p className="text-sm text-muted mt-1">von {stats?.expenseCount ?? 0} Ausgaben</p>
            </>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <Download className="w-4 h-4" />Ergebnis
          </div>
          {loadingStats ? (
            <div className="h-8 bg-background animate-pulse rounded w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold">
                {stats ? fmt(stats.invoiceGrossTotal - stats.expenseGrossTotal) : "0,00"} €
              </p>
              <p className="text-sm text-muted mt-1">Umsatz – Ausgaben</p>
            </>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ZIP Export */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Jahrespaket als ZIP</h2>
            <p className="text-sm text-muted mt-1">Alle Unterlagen in einem Archiv für den Steuerberater</p>
          </div>

          <div className="bg-background rounded-lg p-4 text-xs text-muted font-mono space-y-0.5">
            <p className="font-semibold text-text">Steuerunterlagen_{year}.zip</p>
            <p className="pl-4">├── Rechnungen/  <span className="text-muted">(finalisierte Rechnungen als PDF)</span></p>
            <p className="pl-4">├── Ausgaben/    <span className="text-muted">(hochgeladene Belege)</span></p>
            <p className="pl-4">├── DATEV_{year}.csv  <span className="text-muted">(für DATEV / Lexware)</span></p>
            <p className="pl-4">└── Zusammenfassung_{year}.csv</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={inclInvoices} onChange={e => setInclInvoices(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Rechnungen inkl. PDFs</span>
              {stats && <span className="text-xs text-muted">({stats.invoiceCount} Stück)</span>}
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={inclExpenses} onChange={e => setInclExpenses(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">Ausgaben inkl. Belegen</span>
              {stats && <span className="text-xs text-muted">({stats.expensesWithReceipt} Belege)</span>}
            </label>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading || loadingStats}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Wird erstellt…" : `ZIP herunterladen (${year})`}
          </button>

          {downloading && (
            <p className="text-xs text-muted text-center">
              PDFs werden generiert — je nach Anzahl der Rechnungen kann das einen Moment dauern.
            </p>
          )}
        </div>

        {/* Info + Links */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold">Weitere Exporte</h2>

            <Link
              href="/vat"
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background transition-colors"
            >
              <div>
                <p className="text-sm font-medium">Monatlicher DATEV-Export</p>
                <p className="text-xs text-muted">USt-Voranmeldung + DATEV CSV pro Monat</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </Link>

            <Link
              href="/accounting"
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background transition-colors"
            >
              <div>
                <p className="text-sm font-medium">Buchungsjournal</p>
                <p className="text-xs text-muted">Alle Buchungen einsehen und filtern</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </Link>

            <Link
              href="/expenses"
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background transition-colors"
            >
              <div>
                <p className="text-sm font-medium">Ausgaben verwalten</p>
                <p className="text-xs text-muted">Belege hochladen und Ausgaben buchen</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </Link>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm space-y-2">
            <p className="font-semibold text-primary">Hinweis zur Archivierung</p>
            <p className="text-muted text-xs leading-relaxed">
              Alle Rechnungen werden beim Export live aus den gespeicherten Daten generiert — keine separate Speicherung nötig.
              Die Daten entsprechen den GoBD-Anforderungen zur Unveränderlichkeit.
            </p>
            <p className="text-muted text-xs leading-relaxed">
              <strong className="text-text">DATEV CSV:</strong> Buchungsstapel-Format (EXTF), direkt importierbar in DATEV Unternehmen Online, Lexware buchhalter und kompatible Systeme.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
