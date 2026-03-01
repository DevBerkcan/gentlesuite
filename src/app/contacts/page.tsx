"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ContactsPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  function load(s = "") { api.allContacts(`search=${encodeURIComponent(s)}&pageSize=100`).then(setData).catch(() => setError("Kontakte konnten nicht geladen werden")); }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kontakte</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." className="px-3 py-2 border border-border rounded-lg text-sm w-64" />
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Suchen</button>
        </form>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-background"><th className="px-4 py-3 text-left text-xs text-muted">Name</th><th className="px-4 py-3 text-left text-xs text-muted">E-Mail</th><th className="px-4 py-3 text-left text-xs text-muted">Telefon</th><th className="px-4 py-3 text-left text-xs text-muted">Position</th><th className="px-4 py-3 text-left text-xs text-muted">Firma</th><th className="px-4 py-3 text-left text-xs text-muted">Typ</th></tr></thead>
          <tbody>
            {data?.items?.map((c: any) => (
              <tr key={c.id} className="border-b border-border hover:bg-background cursor-pointer" onClick={() => window.location.href = `/customers/${c.customerId}`}>
                <td className="px-4 py-3 font-medium text-sm">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-sm">{c.email}</td>
                <td className="px-4 py-3 text-sm text-muted">{c.phone || "–"}</td>
                <td className="px-4 py-3 text-sm text-muted">{c.position || "–"}</td>
                <td className="px-4 py-3 text-sm">{c.companyName}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${c.isPrimary ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-muted"}`}>{c.isPrimary ? "Primaer" : "Kontakt"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items?.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Kontakte gefunden.</div>}
        {!data && <div className="p-8 text-center text-muted text-sm">Lade...</div>}
      </div>

      {data && <div className="mt-4 text-sm text-muted">{data.totalCount} Kontakte gesamt</div>}
    </div>
  );
}
