"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [reminders, setReminders] = useState<any>(null);
  const [numberYear, setNumberYear] = useState(new Date().getFullYear());
  const [numberRanges, setNumberRanges] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.settings().then(setForm).catch(() => setError("Einstellungen konnten nicht geladen werden"));
    api.reminderSettings().then(setReminders).catch(() => setError("Mahnlauf-Einstellungen konnten nicht geladen werden"));
  }, []);

  useEffect(() => {
    api.numberRanges(numberYear).then(setNumberRanges).catch(() => setError("Nummernkreise konnten nicht geladen werden"));
  }, [numberYear]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(form);
      setForm(updated);
      setSuccess("Einstellungen gespeichert");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Fehler beim Speichern"); }
  }

  async function handleSaveReminders(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await api.updateReminderSettings(reminders);
      setReminders(updated);
      setSuccess("Mahnlauf-Einstellungen gespeichert");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e?.message || "Fehler beim Speichern der Mahnlauf-Einstellungen");
    }
  }

  async function handleSaveNumberRange(range: any) {
    try {
      await api.updateNumberRange({ ...range, year: numberYear });
      const list = await api.numberRanges(numberYear);
      setNumberRanges(list);
      setSuccess(`Nummernkreis ${range.entityType} gespeichert`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e?.message || "Nummernkreis konnte nicht gespeichert werden");
    }
  }

  if (!form) return <div className="p-8"><div className="text-muted">Laden...</div></div>;

  const f = (field: string, value: any) => setForm({ ...form, [field]: value });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>

      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError("")} className="ml-2 font-bold">x</button></div>}
      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Firmendaten */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Firmendaten</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Firmenname *</label>
              <input required value={form.companyName || ""} onChange={e => f("companyName", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rechtsform / Vollstaendiger Name</label>
              <input value={form.legalName || ""} onChange={e => f("legalName", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Geschaeftsfuehrer</label>
              <input value={form.managingDirector || ""} onChange={e => f("managingDirector", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input value={form.website || ""} onChange={e => f("website", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Strasse *</label>
              <input required value={form.street || ""} onChange={e => f("street", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PLZ *</label>
              <input required value={form.zipCode || ""} onChange={e => f("zipCode", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stadt *</label>
              <input required value={form.city || ""} onChange={e => f("city", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <input value={form.phone || ""} onChange={e => f("phone", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-Mail</label>
              <input type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
          </div>
        </section>

        {/* Steuern & Recht */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Steuern & Recht</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Steuernummer</label>
              <input value={form.taxId || ""} onChange={e => f("taxId", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" placeholder="123/456/78901" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">USt-IdNr.</label>
              <input value={form.vatId || ""} onChange={e => f("vatId", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" placeholder="DE123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amtsgericht</label>
              <input value={form.registerCourt || ""} onChange={e => f("registerCourt", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registernummer (HRB)</label>
              <input value={form.registerNumber || ""} onChange={e => f("registerNumber", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Steuermodus</label>
              <select value={form.defaultTaxMode || "Standard"} onChange={e => f("defaultTaxMode", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg">
                <option value="Standard">Regelbesteuerung (19%)</option>
                <option value="SmallBusiness">Kleinunternehmer (§19 UStG)</option>
                <option value="ReverseCharge">Reverse Charge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Buchfuehrung</label>
              <select value={form.accountingMode || "EUR"} onChange={e => f("accountingMode", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg">
                <option value="EUR">Einnahmen-Ueberschuss-Rechnung (EUR)</option>
                <option value="Bilanz">Bilanzierung</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bankverbindung */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Bankverbindung</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Bank</label>
              <input value={form.bankName || ""} onChange={e => f("bankName", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IBAN</label>
              <input value={form.iban || ""} onChange={e => f("iban", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" placeholder="DE89 3705 0198 ..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">BIC</label>
              <input value={form.bic || ""} onChange={e => f("bic", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
          </div>
        </section>

        {/* Vorlagen */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Dokument-Vorlagen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Zahlungsziel Rechnungen (Tage)</label>
              <input type="number" min="1" value={form.invoicePaymentTermDays || 14} onChange={e => f("invoicePaymentTermDays", Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gueltigkeit Angebote (Tage)</label>
              <input type="number" min="1" value={form.quoteValidityDays || 30} onChange={e => f("quoteValidityDays", Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Rechnungs-Einleitung</label>
              <textarea rows={2} value={form.invoiceIntroTemplate || ""} onChange={e => f("invoiceIntroTemplate", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Rechnungs-Schlusstext</label>
              <textarea rows={2} value={form.invoiceOutroTemplate || ""} onChange={e => f("invoiceOutroTemplate", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Angebots-Einleitung</label>
              <textarea rows={2} value={form.quoteIntroTemplate || ""} onChange={e => f("quoteIntroTemplate", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Angebots-Schlusstext</label>
              <textarea rows={2} value={form.quoteOutroTemplate || ""} onChange={e => f("quoteOutroTemplate", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
        </section>

        <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">Speichern</button>
      </form>

      {/* Logo Upload */}
      <section className="bg-surface rounded-xl border border-border p-6 mt-8">
        <h2 className="font-semibold mb-4">Firmenlogo</h2>
        <p className="text-sm text-muted mb-3">Das Logo wird auf Rechnungen und Angeboten angezeigt.</p>
        {form.logoPath && <div className="mb-3"><img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/${form.logoPath}`} alt="Logo" className="max-h-16 object-contain" /></div>}
        <input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          try { const res = await api.uploadLogo(file); setForm({ ...form, logoPath: res.path }); setSuccess("Logo hochgeladen"); setTimeout(() => setSuccess(""), 3000); } catch (err: any) { setError(err.message); }
        }} className="text-sm" />
      </section>

      {reminders && (
        <section className="bg-surface rounded-xl border border-border p-6 mt-8">
          <h2 className="font-semibold mb-4">Mahnwesen</h2>
          <form onSubmit={handleSaveReminders} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">1. Mahnung (Tage)</label>
                <input type="number" min="1" value={reminders.level1Days} onChange={e => setReminders({ ...reminders, level1Days: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">2. Mahnung (Tage)</label>
                <input type="number" min="1" value={reminders.level2Days} onChange={e => setReminders({ ...reminders, level2Days: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Letzte Mahnung (Tage)</label>
                <input type="number" min="1" value={reminders.level3Days} onChange={e => setReminders({ ...reminders, level3Days: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gebuehr 1. Mahnung (EUR)</label>
                <input type="number" min="0" step="0.01" value={reminders.level1Fee} onChange={e => setReminders({ ...reminders, level1Fee: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gebuehr 2. Mahnung (EUR)</label>
                <input type="number" min="0" step="0.01" value={reminders.level2Fee} onChange={e => setReminders({ ...reminders, level2Fee: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gebuehr letzte Mahnung (EUR)</label>
                <input type="number" min="0" step="0.01" value={reminders.level3Fee} onChange={e => setReminders({ ...reminders, level3Fee: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
              </div>
            </div>
            <div className="max-w-xs">
              <label className="block text-sm font-medium mb-1">Verzugszins p.a. (%)</label>
              <input type="number" min="0" step="0.01" value={reminders.annualInterestPercent} onChange={e => setReminders({ ...reminders, annualInterestPercent: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg" />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">Mahnwesen speichern</button>
          </form>
        </section>
      )}

      <section className="bg-surface rounded-xl border border-border p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Nummernkreise</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">Jahr</label>
            <input type="number" min="2000" max="2100" value={numberYear} onChange={e => setNumberYear(Number(e.target.value))} className="w-24 px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div className="space-y-3">
          {numberRanges.map((range, idx) => (
            <div key={`${range.entityType}-${idx}`} className="grid grid-cols-12 gap-3 items-end border border-border rounded-lg p-3">
              <div className="col-span-3">
                <label className="block text-xs text-muted mb-1">Typ</label>
                <input value={range.entityType} readOnly className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-muted mb-1">Prefix</label>
                <input value={range.prefix} onChange={e => setNumberRanges(numberRanges.map((r, i) => i === idx ? { ...r, prefix: e.target.value } : r))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">Naechster Wert</label>
                <input type="number" min="1" value={range.nextValue} onChange={e => setNumberRanges(numberRanges.map((r, i) => i === idx ? { ...r, nextValue: Number(e.target.value) } : r))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">Padding</label>
                <input type="number" min="1" max="10" value={range.padding} onChange={e => setNumberRanges(numberRanges.map((r, i) => i === idx ? { ...r, padding: Number(e.target.value) } : r))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <button type="button" onClick={() => handleSaveNumberRange(range)} className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">Speichern</button>
              </div>
            </div>
          ))}
          {numberRanges.length === 0 && <div className="text-sm text-muted">Keine Nummernkreise gefunden.</div>}
        </div>
      </section>
    </div>
  );
}
