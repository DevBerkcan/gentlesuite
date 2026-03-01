"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ServiceCatalogPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [catModal, setCatModal] = useState<{ id?: string; name: string; description: string; sortOrder: number } | null>(null);
  const [itemModal, setItemModal] = useState<{ id?: string; categoryId: string; name: string; description: string; shortCode: string; defaultPrice: number; defaultLineType: string; sortOrder: number } | null>(null);

  const load = () => api.services().then(setCategories).catch(() => setError("Leistungskatalog konnte nicht geladen werden"));
  useEffect(() => { load(); }, []);

  const saveCat = async () => {
    if (!catModal) return;
    try {
      if (catModal.id) await api.updateServiceCategory(catModal.id, catModal);
      else await api.createServiceCategory(catModal);
      setCatModal(null); setSuccess("Gespeichert"); setTimeout(() => setSuccess(""), 3000); load();
    } catch (e: any) { setError(e.message); }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Kategorie wirklich loeschen?")) return;
    try { await api.deleteServiceCategory(id); load(); } catch (e: any) { setError(e.message); }
  };

  const saveItem = async () => {
    if (!itemModal) return;
    try {
      if (itemModal.id) await api.updateServiceItem(itemModal.id, itemModal);
      else await api.createServiceItem(itemModal);
      setItemModal(null); setSuccess("Gespeichert"); setTimeout(() => setSuccess(""), 3000); load();
    } catch (e: any) { setError(e.message); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Leistung wirklich loeschen?")) return;
    try { await api.deleteServiceItem(id); load(); } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leistungskatalog</h1>
        <button onClick={() => setCatModal({ name: "", description: "", sortOrder: 0 })} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">+ Neue Kategorie</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="space-y-4">
        {categories.map((cat: any) => (
          <div key={cat.id} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{cat.name}</h2>
              <div className="flex gap-2">
                <button onClick={() => setItemModal({ categoryId: cat.id, name: "", description: "", shortCode: "", defaultPrice: 0, defaultLineType: "OneTime", sortOrder: 0 })} className="text-xs text-primary hover:underline">+ Leistung</button>
                <button onClick={() => setCatModal({ id: cat.id, name: cat.name, description: cat.description || "", sortOrder: cat.sortOrder })} className="text-xs text-muted hover:underline">Bearbeiten</button>
                <button onClick={() => deleteCat(cat.id)} className="text-xs text-danger hover:underline">Loeschen</button>
              </div>
            </div>
            {cat.description && <p className="text-sm text-muted mb-3">{cat.description}</p>}
            {cat.items?.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="px-2 py-1 text-left text-xs text-muted">Name</th><th className="px-2 py-1 text-left text-xs text-muted">Kurzcode</th><th className="px-2 py-1 text-right text-xs text-muted">Preis</th><th className="px-2 py-1 text-left text-xs text-muted">Typ</th><th className="px-2 py-1 text-right text-xs text-muted"></th></tr></thead>
                <tbody>{cat.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-2">{item.name}</td>
                    <td className="px-2 py-2 text-muted">{item.shortCode || "–"}</td>
                    <td className="px-2 py-2 text-right">{item.defaultPrice?.toFixed(2) || "–"} EUR</td>
                    <td className="px-2 py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-background">{item.defaultLineType === "Monthly" ? "Monatlich" : "Einmalig"}</span></td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => setItemModal({ id: item.id, categoryId: cat.id, name: item.name, description: item.description || "", shortCode: item.shortCode || "", defaultPrice: item.defaultPrice || 0, defaultLineType: item.defaultLineType || "OneTime", sortOrder: item.sortOrder })} className="text-xs text-primary hover:underline mr-2">Edit</button>
                      <button onClick={() => deleteItem(item.id)} className="text-xs text-danger hover:underline">x</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="text-sm text-muted">Keine Leistungen in dieser Kategorie.</p>}
          </div>
        ))}
        {categories.length === 0 && <div className="text-center text-muted text-sm py-8">Keine Kategorien vorhanden.</div>}
      </div>

      {catModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">{catModal.id ? "Kategorie bearbeiten" : "Neue Kategorie"}</h2>
        <div className="space-y-3">
          <div><label className="text-xs text-muted block mb-1">Name</label><input value={catModal.name} onChange={e => setCatModal({...catModal, name: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Beschreibung</label><textarea value={catModal.description} onChange={e => setCatModal({...catModal, description: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Sortierung</label><input type="number" value={catModal.sortOrder} onChange={e => setCatModal({...catModal, sortOrder: +e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div className="flex gap-2 pt-2"><button onClick={saveCat} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Speichern</button><button onClick={() => setCatModal(null)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button></div>
        </div>
      </div></div>}

      {itemModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">{itemModal.id ? "Leistung bearbeiten" : "Neue Leistung"}</h2>
        <div className="space-y-3">
          <div><label className="text-xs text-muted block mb-1">Name</label><input value={itemModal.name} onChange={e => setItemModal({...itemModal, name: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Kurzcode</label><input value={itemModal.shortCode} onChange={e => setItemModal({...itemModal, shortCode: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Standardpreis</label><input type="number" step="0.01" value={itemModal.defaultPrice} onChange={e => setItemModal({...itemModal, defaultPrice: +e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Typ</label><select value={itemModal.defaultLineType} onChange={e => setItemModal({...itemModal, defaultLineType: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"><option value="OneTime">Einmalig</option><option value="Monthly">Monatlich</option></select></div>
          <div><label className="text-xs text-muted block mb-1">Beschreibung</label><textarea value={itemModal.description} onChange={e => setItemModal({...itemModal, description: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div className="flex gap-2 pt-2"><button onClick={saveItem} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Speichern</button><button onClick={() => setItemModal(null)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button></div>
        </div>
      </div></div>}
    </div>
  );
}
