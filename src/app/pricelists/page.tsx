"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const emptyItemForm = { title: "", description: "", unit: "pauschal", unitPrice: "", sortOrder: 0 };

export default function PriceListsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editingList, setEditingList] = useState<any | null>(null);
  const [editListForm, setEditListForm] = useState({ name: "", description: "", isActive: true });
  const [showItemForm, setShowItemForm] = useState<string | null>(null); // holds listId
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({ ...emptyItemForm });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = () =>
    api.priceListTemplates().then((d: any) => setTemplates(Array.isArray(d) ? d : [])).catch(() => setError("Vorlagen konnten nicht geladen werden"));

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createPriceList({ customerId: null, name: createForm.name, description: createForm.description || null, isTemplate: true });
      setShowCreateForm(false);
      setCreateForm({ name: "", description: "" });
      setSuccess("Vorlage erstellt");
      setTimeout(() => setSuccess(""), 3000);
      loadTemplates();
    } catch { setError("Fehler beim Erstellen der Vorlage"); }
  }

  async function handleEditTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.updatePriceList(editingList.id, editListForm);
      setEditingList(null);
      setSuccess("Vorlage aktualisiert");
      setTimeout(() => setSuccess(""), 3000);
      loadTemplates();
    } catch { setError("Fehler beim Aktualisieren der Vorlage"); }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Vorlage wirklich löschen? Bereits erstellte Kopien bei Kunden bleiben erhalten.")) return;
    try {
      await api.deletePriceList(id);
      setSuccess("Vorlage gelöscht");
      setTimeout(() => setSuccess(""), 3000);
      loadTemplates();
    } catch { setError("Fehler beim Löschen der Vorlage"); }
  }

  function openAddItem(listId: string) {
    setEditingItem(null);
    setItemForm({ ...emptyItemForm, sortOrder: (templates.find(t => t.id === listId)?.items || []).length });
    setShowItemForm(listId);
  }

  function openEditItem(listId: string, item: any) {
    setEditingItem(item);
    setItemForm({ title: item.title, description: item.description || "", unit: item.unit, unitPrice: String(item.unitPrice), sortOrder: item.sortOrder });
    setShowItemForm(listId);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    const payload = { title: itemForm.title, description: itemForm.description || null, unit: itemForm.unit, unitPrice: parseFloat(itemForm.unitPrice) || 0, sortOrder: itemForm.sortOrder };
    try {
      if (editingItem) {
        await api.updatePriceListItem(showItemForm!, editingItem.id, payload);
      } else {
        await api.addPriceListItem(showItemForm!, payload);
      }
      setShowItemForm(null);
      setEditingItem(null);
      setItemForm({ ...emptyItemForm });
      setSuccess("Position gespeichert");
      setTimeout(() => setSuccess(""), 3000);
      loadTemplates();
    } catch { setError("Fehler beim Speichern der Position"); }
  }

  async function handleDeleteItem(listId: string, itemId: string) {
    if (!confirm("Position wirklich löschen?")) return;
    try {
      await api.deletePriceListItem(listId, itemId);
      loadTemplates();
    } catch { setError("Fehler beim Löschen der Position"); }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Preislisten-Vorlagen</h1>
          <p className="text-sm text-muted mt-1">Globale Vorlagen, die Sie Kunden per Knopfdruck zuweisen können</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">+ Neue Vorlage</button>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg text-sm mb-4 flex justify-between">{error}<button onClick={() => setError("")} className="ml-2 font-bold">×</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg text-sm mb-4">{success}</div>}

      {showCreateForm && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <h2 className="font-semibold mb-3">Neue Vorlage erstellen</h2>
          <form onSubmit={handleCreateTemplate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">Name *</label>
                <input required value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Webdesign Standard" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Beschreibung</label>
                <input value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Optionale Beschreibung" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Erstellen</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {templates.map((tpl: any) => (
          <div key={tpl.id} className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}>
                <span className="font-medium">{tpl.name}</span>
                {tpl.description && <span className="text-sm text-muted">{tpl.description}</span>}
                <span className="text-xs text-muted bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Vorlage</span>
                <span className="text-xs text-muted">{(tpl.items || []).length} Positionen</span>
                {tpl.items && tpl.items.length > 0 && (
                  <span className="text-xs text-muted">
                    · {tpl.items.reduce((s: number, i: any) => s + Number(i.unitPrice), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingList(tpl); setEditListForm({ name: tpl.name, description: tpl.description || "", isActive: tpl.isActive }); }} className="text-xs text-primary hover:underline">Bearbeiten</button>
                <button onClick={() => handleDeleteTemplate(tpl.id)} className="text-xs text-danger hover:underline">Löschen</button>
                <span className="text-muted text-sm cursor-pointer" onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}>{expandedId === tpl.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expandedId === tpl.id && (
              <div className="border-t border-border p-4">
                {(tpl.items || []).length > 0 ? (
                  <table className="w-full text-sm mb-3">
                    <thead>
                      <tr className="text-xs text-muted border-b border-border">
                        <th className="pb-2 text-left w-6">#</th>
                        <th className="pb-2 text-left">Bezeichnung</th>
                        <th className="pb-2 text-left">Beschreibung</th>
                        <th className="pb-2 text-left">Einheit</th>
                        <th className="pb-2 text-right">Preis</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(tpl.items || [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((item: any, idx: number) => (
                        <tr key={item.id} className="border-b border-border">
                          <td className="py-2 text-muted">{idx + 1}</td>
                          <td className="py-2 font-medium">{item.title}</td>
                          <td className="py-2 text-muted text-xs">{item.description || "–"}</td>
                          <td className="py-2 text-muted">{item.unit}</td>
                          <td className="py-2 text-right font-medium">{Number(item.unitPrice).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                          <td className="py-2 text-right space-x-2">
                            <button onClick={() => openEditItem(tpl.id, item)} className="text-xs text-primary hover:underline">Bearb.</button>
                            <button onClick={() => handleDeleteItem(tpl.id, item.id)} className="text-xs text-danger hover:underline">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted mb-3">Noch keine Positionen</p>
                )}

                {showItemForm === tpl.id ? (
                  <form onSubmit={handleSaveItem} className="bg-background border border-border rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="col-span-2">
                        <label className="block text-xs text-muted mb-1">Bezeichnung *</label>
                        <input required value={itemForm.title} onChange={e => setItemForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Webseite Landingpage" className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-muted mb-1">Beschreibung</label>
                        <input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} placeholder="z.B. Responsive, CMS-fähig" className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">Einheit</label>
                        <select value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-2 py-1.5 border border-border rounded text-sm">
                          <option value="pauschal">pauschal</option>
                          <option value="h">h (Stunde)</option>
                          <option value="Stk">Stk (Stück)</option>
                          <option value="Monat">Monat</option>
                          <option value="jährlich">jährlich</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">Preis (€)</label>
                        <input type="number" step="0.01" min="0" required value={itemForm.unitPrice} onChange={e => setItemForm(f => ({ ...f, unitPrice: e.target.value }))} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowItemForm(null); setEditingItem(null); }} className="px-3 py-1.5 border border-border rounded text-xs">Abbrechen</button>
                      <button type="submit" className="px-3 py-1.5 bg-primary text-white rounded text-xs">Speichern</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => openAddItem(tpl.id)} className="text-sm text-primary hover:underline">+ Position hinzufügen</button>
                )}
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && !showCreateForm && (
          <div className="text-center py-16 text-muted text-sm">Noch keine Vorlagen vorhanden. Erstellen Sie Ihre erste Vorlage.</div>
        )}
      </div>

      {/* Edit Template Modal */}
      {editingList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingList(null)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Vorlage bearbeiten</h2>
            <form onSubmit={handleEditTemplate} className="space-y-3">
              <div>
                <label className="block text-sm text-muted mb-1">Name *</label>
                <input required value={editListForm.name} onChange={e => setEditListForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Beschreibung</label>
                <input value={editListForm.description} onChange={e => setEditListForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editListForm.isActive} onChange={e => setEditListForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary" />
                Aktiv
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditingList(null)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
