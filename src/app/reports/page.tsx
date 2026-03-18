"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [expByCategory, setExpByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.reportMonthlyFinance(year),
      api.reportRevenueByCustomer(year),
      api.reportExpenseByCategory(year),
    ]).then(([m, c, e]) => {
      setMonthly(m);
      setTopCustomers(c);
      setExpByCategory(e);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  const totalRevenue = monthly.reduce((s: number, m: any) => s + m.revenue, 0);
  const totalExpenses = monthly.reduce((s: number, m: any) => s + m.expenses, 0);

  const fmt = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  const exportCsv = () => {
    const rows = ["Monat;Umsatz (EUR);Ausgaben (EUR);Ergebnis (EUR)"];
    monthly.forEach((m: any) => {
      const result = m.revenue - m.expenses;
      rows.push(`${MONTHS[m.month - 1]} ${year};${m.revenue.toFixed(2)};${m.expenses.toFixed(2)};${result.toFixed(2)}`);
    });
    rows.push("");
    rows.push(`Gesamt;${totalRevenue.toFixed(2)};${totalExpenses.toFixed(2)};${(totalRevenue - totalExpenses).toFixed(2)}`);
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Bericht_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Berichte</h1>
          <p className="text-muted text-sm mt-1">Umsatz, Ausgaben und Kundenprofitabilität</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 bg-surface text-sm"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {!loading && monthly.length > 0 && (
            <button onClick={exportCsv} className="text-xs px-3 py-2 border border-border rounded-lg hover:bg-background">↓ CSV-Export</button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Gesamtumsatz {year}</p>
          <p className="text-2xl font-bold text-primary mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Gesamtausgaben {year}</p>
          <p className="text-2xl font-bold text-danger mt-1">{fmt(totalExpenses)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Ergebnis {year}</p>
          <p className={`text-2xl font-bold mt-1 ${totalRevenue - totalExpenses >= 0 ? "text-success" : "text-danger"}`}>
            {fmt(totalRevenue - totalExpenses)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Lade Daten...</div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Chart */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Umsatz & Ausgaben nach Monat</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly.map((m: any) => ({ name: MONTHS[m.month - 1], Umsatz: m.revenue, Ausgaben: m.expenses }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Umsatz" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ausgaben" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Top Customers */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Top-Kunden nach Umsatz</h2>
              {topCustomers.length === 0 ? (
                <p className="text-muted text-sm">Keine Rechnungen für {year}</p>
              ) : (
                <div className="space-y-3">
                  {topCustomers.slice(0, 8).map((c: any, i: number) => (
                    <div key={c.customerId} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-5 text-right font-medium">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm font-medium truncate">{c.customerName}</span>
                          <span className="text-sm font-semibold ml-2 shrink-0">{fmt(c.revenue)}</span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (c.revenue / topCustomers[0].revenue) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses by Category */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Ausgaben nach Kategorie</h2>
              {expByCategory.length === 0 ? (
                <p className="text-muted text-sm">Keine Ausgaben für {year}</p>
              ) : (
                <div className="flex items-center gap-4">
                  <PieChart width={160} height={160}>
                    <Pie data={expByCategory} dataKey="amount" cx={75} cy={75} innerRadius={40} outerRadius={75}>
                      {expByCategory.map((_: any, idx: number) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="flex-1 space-y-2">
                    {expByCategory.slice(0, 6).map((e: any, i: number) => (
                      <div key={e.categoryName} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate flex-1">{e.categoryName}</span>
                        <span className="font-medium shrink-0">{fmt(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
