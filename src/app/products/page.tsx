"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const UNITS = ["h", "Tag", "Stk", "Pauschal"];
const EMPTY_FORM = { name: "", description: "", unit: "h", defaultPrice: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [memberModal, setMemberModal] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });

  const load = () => {
    api.products().then(setProducts).catch(() => setError("Produkte konnten nicht geladen werden"));
    api.teamMembers().then(setTeamMembers).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, editing: null }); };
  const openEdit = (p: any) => {
    setForm({ name: p.name, description: p.description || "", unit: p.unit, defaultPrice: String(p.defaultPrice), isActive: p.isActive });
    setModal({ open: true, editing: p });
  };
  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, defaultPrice: parseFloat(form.defaultPrice) || 0 };
      if (modal.editing) {
        await api.updateProduct(modal.editing.id, { ...payload, isActive: form.isActive ?? true });
      } else {
        await api.createProduct(payload);
      }
      load();
      closeModal();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Produkt "${p.name}" wirklich löschen?`)) return;
    try { await api.deleteProduct(p.id); load(); } catch (e: any) { setError(e.message); }
  };

  const toggleMember = async (product: any, member: any) => {
    const assigned = product.teamMembers?.some((m: any) => m.id === member.id);
    try {
      if (assigned) await api.removeProductMember(product.id, member.id);
      else await api.addProductMember(product.id, member.id);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const filtered = products.filter(p => {
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produkte & Leistungen</h1>
        <div className="flex items-center gap-3">
          <input placeholder="Suche..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm w-48" />
          <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">+ Produkt</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">×</button></div>}

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left text-xs text-muted">Name</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Einheit</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Standardpreis</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Mitarbeiter</th>
              <th className="px-4 py-3 text-left text-xs text-muted">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-b border-border hover:bg-background/50">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium">{p.name}</div>
                  {p.description && <div className="text-xs text-muted mt-0.5">{p.description}</div>}
                </td>
                <td className="px-4 py-3 text-sm text-muted">{p.unit}</td>
                <td className="px-4 py-3 text-sm font-medium">{Number(p.defaultPrice).toFixed(2)} €</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.teamMembers || []).map((m: any) => (
                      <span key={m.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{m.firstName} {m.lastName}</span>
                    ))}
                    <button onClick={() => setMemberModal({ open: true, product: p })} className="text-xs text-muted hover:text-primary px-1">+ Zuordnen</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.isActive ? "bg-green-50 text-success" : "bg-gray-100 text-muted"}`}>{p.isActive ? "Aktiv" : "Inaktiv"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="text-xs text-primary mr-3 hover:underline">Bearbeiten</button>
                  <button onClick={() => handleDelete(p)} className="text-xs text-danger hover:underline">Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted text-sm">Keine Produkte vorhanden.</div>}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{modal.editing ? "Produkt bearbeiten" : "Neues Produkt"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Beschreibung</label>
                <textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Einheit</label>
                  <select value={form.unit} onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Standardpreis (€)</label>
                  <input type="number" step="0.01" value={form.defaultPrice} onChange={e => setForm((f: any) => ({ ...f, defaultPrice: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>
              {modal.editing && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActiveP" checked={form.isActive ?? true} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <label htmlFor="isActiveP" className="text-sm">Aktiv</label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Speichern..." : "Speichern"}</button>
            </div>
          </div>
        </div>
      )}

      {memberModal.open && memberModal.product && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Mitarbeiter für „{memberModal.product.name}"</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {teamMembers.map((m: any) => {
                const assigned = memberModal.product.teamMembers?.some((tm: any) => tm.id === m.id);
                return (
                  <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background cursor-pointer">
                    <input type="checkbox" checked={assigned} onChange={() => { toggleMember(memberModal.product, m); setMemberModal(prev => ({ ...prev, product: { ...prev.product!, teamMembers: assigned ? prev.product!.teamMembers.filter((x: any) => x.id !== m.id) : [...(prev.product!.teamMembers || []), m] } })); }} className="rounded" />
                    <span className="text-sm">{m.firstName} {m.lastName}</span>
                    {m.jobTitle && <span className="text-xs text-muted">{m.jobTitle}</span>}
                  </label>
                );
              })}
              {teamMembers.length === 0 && <p className="text-sm text-muted text-center py-4">Keine Mitarbeiter vorhanden. Zuerst unter „Mitarbeiter" anlegen.</p>}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => { setMemberModal({ open: false, product: null }); load(); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Fertig</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
