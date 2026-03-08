"use client";
import { useEffect, useState, Fragment } from "react";
import { api } from "@/lib/api";

const emptyListForm = { name: "", description: "" };
const emptyItemForm = { productId: "", customPrice: 0, teamMemberId: "", note: "" };

export default function PriceListsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showCreateList, setShowCreateList] = useState(false);
  const [listForm, setListForm] = useState(emptyListForm);

  const [editingList, setEditingList] = useState<any | null>(null);
  const [editListForm, setEditListForm] = useState({ name: "", description: "", isActive: true });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForListId, setItemForListId] = useState("");
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.customers().then((d: any) => setCustomers(d.items || [])).catch(() => {});
    api.products().then((d: any) => setProducts(Array.isArray(d) ? d : d.items || [])).catch(() => {});
    api.teamMembers().then((d: any) => setTeamMembers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) { setPriceLists([]); return; }
    api.priceLists(selectedCustomerId).then((d: any) => setPriceLists(Array.isArray(d) ? d : [])).catch(() => setError("Preislisten konnten nicht geladen werden"));
  }, [selectedCustomerId]);

  const reloadLists = () => {
    if (!selectedCustomerId) return;
    api.priceLists(selectedCustomerId).then((d: any) => setPriceLists(Array.isArray(d) ? d : [])).catch(() => {});
  };

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createPriceList({ customerId: selectedCustomerId, ...listForm });
      setShowCreateList(false);
      setListForm(emptyListForm);
      setSuccess("Preisliste erstellt");
      setTimeout(() => setSuccess(""), 3000);
      reloadLists();
    } catch { setError("Fehler beim Erstellen der Preisliste"); }
  }

  async function handleEditList(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.updatePriceList(editingList.id, editListForm);
      setEditingList(null);
      setSuccess("Preisliste aktualisiert");
      setTimeout(() => setSuccess(""), 3000);
      reloadLists();
    } catch { setError("Fehler beim Aktualisieren der Preisliste"); }
  }

  async function handleDeleteList(id: string) {
    if (!confirm("Preisliste wirklich löschen?")) return;
    try {
      await api.deletePriceList(id);
      setSuccess("Preisliste gelöscht");
      setTimeout(() => setSuccess(""), 3000);
      reloadLists();
    } catch { setError("Fehler beim Löschen der Preisliste"); }
  }

  function openAddItem(listId: string) {
    setItemForListId(listId);
    setEditingItem(null);
    setItemForm(emptyItemForm);
    setShowItemModal(true);
  }

  function openEditItem(listId: string, item: any) {
    setItemForListId(listId);
    setEditingItem(item);
    setItemForm({ productId: item.productId, customPrice: item.customPrice, teamMemberId: item.teamMemberId || "", note: item.note || "" });
    setShowItemModal(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      productId: itemForm.productId,
      customPrice: Number(itemForm.customPrice),
      teamMemberId: itemForm.teamMemberId || null,
      note: itemForm.note || null,
      sortOrder: editingItem?.sortOrder ?? 0,
    };
    try {
      if (editingItem) {
        await api.updatePriceListItem(itemForListId, editingItem.id, payload);
      } else {
        await api.addPriceListItem(itemForListId, payload);
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm(emptyItemForm);
      setSuccess("Position gespeichert");
      setTimeout(() => setSuccess(""), 3000);
      reloadLists();
    } catch { setError("Fehler beim Speichern der Position"); }
  }

  async function handleDeleteItem(listId: string, itemId: string) {
    if (!confirm("Position wirklich löschen?")) return;
    try {
      await api.deletePriceListItem(listId, itemId);
      reloadLists();
    } catch { setError("Fehler beim Löschen der Position"); }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preislisten</h1>
          <p className="text-sm text-gray-500 mt-1">Individuelle Preise pro Kunde</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            <option value="">Kunde auswählen...</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.companyName || c.email}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateList(true)}
            disabled={!selectedCustomerId}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Neue Preisliste
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4 flex justify-between">
          {error}
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-2">×</button>
        </div>
      )}
      {success && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">{success}</div>}

      {!selectedCustomerId ? (
        <div className="text-center py-16 text-gray-400 text-sm">Bitte wählen Sie einen Kunden aus</div>
      ) : priceLists.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Keine Preislisten für diesen Kunden vorhanden</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Beschreibung</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Positionen</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {priceLists.map((pl: any) => (
                <Fragment key={pl.id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{pl.name}</td>
                    <td className="px-4 py-3 text-gray-500">{pl.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${pl.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {pl.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{pl.items?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
                        className="text-gray-400 hover:text-gray-700 text-xs border border-gray-200 px-2 py-1 rounded"
                      >
                        {expandedId === pl.id ? "▲ Einklappen" : "▼ Positionen"}
                      </button>
                      <button
                        onClick={() => { setEditingList(pl); setEditListForm({ name: pl.name, description: pl.description || "", isActive: pl.isActive }); }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteList(pl.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                  {expandedId === pl.id && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 px-6 py-4">
                        <div className="mb-3 flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Positionen</span>
                          <button
                            onClick={() => openAddItem(pl.id)}
                            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800"
                          >
                            + Position hinzufügen
                          </button>
                        </div>
                        {pl.items && pl.items.length > 0 ? (
                          <table className="w-full text-sm bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Produkt</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Einheit</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Preis</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Mitarbeiter</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Notiz</th>
                                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Aktionen</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pl.items.map((item: any) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                  <td className="px-3 py-2 font-medium text-gray-800">{item.productName}</td>
                                  <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                                  <td className="px-3 py-2 text-gray-800">{Number(item.customPrice).toFixed(2)} €</td>
                                  <td className="px-3 py-2 text-gray-500">{item.teamMemberName || "—"}</td>
                                  <td className="px-3 py-2 text-gray-500">{item.note || "—"}</td>
                                  <td className="px-3 py-2 text-right space-x-2">
                                    <button onClick={() => openEditItem(pl.id, item)} className="text-blue-600 hover:text-blue-800 text-xs">Bearbeiten</button>
                                    <button onClick={() => handleDeleteItem(pl.id, item.id)} className="text-red-500 hover:text-red-700 text-xs">Löschen</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-gray-400 py-2">Noch keine Positionen vorhanden</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateList && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Neue Preisliste</h2>
            </div>
            <form onSubmit={handleCreateList} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={listForm.name}
                  onChange={e => setListForm({ ...listForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Sonderpreise 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <input
                  value={listForm.description}
                  onChange={e => setListForm({ ...listForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Optionale Beschreibung"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowCreateList(false); setListForm(emptyListForm); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Abbrechen</button>
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">Erstellen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {editingList && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Preisliste bearbeiten</h2>
            </div>
            <form onSubmit={handleEditList} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={editListForm.name}
                  onChange={e => setEditListForm({ ...editListForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <input
                  value={editListForm.description}
                  onChange={e => setEditListForm({ ...editListForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editListForm.isActive}
                  onChange={e => setEditListForm({ ...editListForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Aktiv</label>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingList(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Abbrechen</button>
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{editingItem ? "Position bearbeiten" : "Position hinzufügen"}</h2>
            </div>
            <form onSubmit={handleSaveItem} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produkt *</label>
                <select
                  required
                  value={itemForm.productId}
                  onChange={e => setItemForm({ ...itemForm, productId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                >
                  <option value="">Produkt auswählen...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preis (€) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.customPrice}
                  onChange={e => setItemForm({ ...itemForm, customPrice: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mitarbeiter (optional)</label>
                <select
                  value={itemForm.teamMemberId}
                  onChange={e => setItemForm({ ...itemForm, teamMemberId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                >
                  <option value="">— kein Mitarbeiter —</option>
                  {teamMembers.map((tm: any) => (
                    <option key={tm.id} value={tm.id}>{tm.fullName || tm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
                <input
                  value={itemForm.note}
                  onChange={e => setItemForm({ ...itemForm, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Optionale Anmerkung"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowItemModal(false); setEditingItem(null); setItemForm(emptyItemForm); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Abbrechen
                </button>
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
