"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [pendingSubCount, setPendingSubCount] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { window.location.href = "/login"; return; }
    api.kpis().then(setKpis).catch(() => {});
    api.finance().then(setFinance).catch(() => {});
    api.allSubs().then((list: any[]) => {
      setPendingSubCount((list || []).filter((s: any) => s.status === "PendingConfirmation").length);
    }).catch(() => {});
  }, []);

  const chartData = finance?.revenueChart?.map((m: any) => ({
    name: `${MONTHS[m.month - 1]} ${m.year}`,
    Umsatz: m.revenue,
    Ausgaben: m.expenses,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {pendingSubCount > 0 && (
        <Link href="/subscriptions" className="block mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 hover:bg-orange-100 transition-colors">
          <span className="font-semibold">⚠ {pendingSubCount} Abonnement{pendingSubCount > 1 ? "s warten" : " wartet"} auf Bestätigung</span>
          <span className="text-orange-500">→ Jetzt bestätigen</span>
        </Link>
      )}

      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Aktive Kunden", value: kpis.activeCustomers, color: "text-primary" },
            { label: "Offene Angebote", value: kpis.openQuotes, color: "text-warning" },
            { label: "Ueberfaellige Rechnungen", value: kpis.overdueInvoices, color: "text-danger" },
            { label: "Monatl. Umsatz (MRR)", value: `${kpis.monthlyRecurringRevenue?.toFixed(0)} EUR`, color: "text-success" },
            { label: "Aktive Abonnements", value: kpis.activeSubscriptions, color: "text-primary" },
            { label: "Offene Onboardings", value: kpis.openOnboardings, color: "text-blue-700" },
            { label: "Ueberfaellige Aufgaben", value: kpis.overdueTasks, color: "text-danger" },
          ].map((kpi, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5">
              <p className="text-sm text-muted mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {finance && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Umsatz diesen Monat</p>
            <p className="text-xl font-bold text-success">{finance.revenueThisMonth?.toFixed(2)} EUR</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Offene Forderungen</p>
            <p className="text-xl font-bold text-warning">{finance.openReceivables?.toFixed(2)} EUR</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm text-muted mb-1">Steuer-Ruecklage Empfehlung</p>
            <p className="text-xl font-bold">{finance.taxReserveRecommendation?.toFixed(2)} EUR</p>
          </div>
        </div>
      )}

      {chartData?.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6 mb-8">
          <h2 className="font-semibold mb-4">Umsatz & Ausgaben (6 Monate)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#667085" }} />
              <YAxis tick={{ fontSize: 12, fill: "#667085" }} tickFormatter={(v: number) => `${v.toLocaleString("de-DE")} EUR`} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)} EUR`]} contentStyle={{ borderRadius: "8px", border: "1px solid #EAECF0" }} />
              <Legend />
              <Bar dataKey="Umsatz" fill="#027A48" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ausgaben" fill="#B42318" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <h2 className="font-semibold mb-3">Schnellzugriff</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/customers" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Neuer Kunde</h3>
          <p className="text-xs text-muted">Kunden anlegen</p>
        </Link>
        <Link href="/quotes" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Neues Angebot</h3>
          <p className="text-xs text-muted">Angebot erstellen</p>
        </Link>
        <Link href="/invoices" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Neue Rechnung</h3>
          <p className="text-xs text-muted">Rechnung erstellen</p>
        </Link>
        <Link href="/projects" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Neues Projekt</h3>
          <p className="text-xs text-muted">Projekt anlegen</p>
        </Link>
        <Link href="/expenses" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Neue Ausgabe</h3>
          <p className="text-xs text-muted">Ausgabe erfassen</p>
        </Link>
        <Link href="/time" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Zeiteintrag</h3>
          <p className="text-xs text-muted">Zeit erfassen</p>
        </Link>
        <Link href="/accounting" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">Buchhaltung</h3>
          <p className="text-xs text-muted">Journal & Konten</p>
        </Link>
        <Link href="/vat" className="bg-surface rounded-xl border border-border p-5 hover:border-primary transition-colors">
          <h3 className="font-semibold mb-1 text-sm">USt-Voranmeldung</h3>
          <p className="text-xs text-muted">Steuer & DATEV</p>
        </Link>
      </div>
    </div>
  );
}
