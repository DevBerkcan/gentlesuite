"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

const emptyForm = {
  companyName: "",
  firstName: "",
  lastName: "",
  phone: "",
  street: "",
  city: "",
  zipCode: "",
  country: "Deutschland",
};

export default function IntakePage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getIntake(token)
      .then((data: any) => {
        setInfo(data);
        if (data.companyName && data.companyName !== data.email) {
          setForm(f => ({ ...f, companyName: data.companyName }));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.submitIntake(token, form);
      setDone(true);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Laden...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link ungültig</h1>
          <p className="text-gray-500 text-sm">Dieser Link ist nicht mehr gültig oder wurde bereits verwendet.</p>
        </div>
      </div>
    );
  }

  if (info?.alreadyCompleted || done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Vielen Dank!</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            {done
              ? "Ihre Daten wurden erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen."
              : "Dieses Formular wurde bereits ausgefüllt. Vielen Dank!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-lg">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="text-2xl font-bold text-gray-900 mb-1">Gentlegroup</div>
          <h2 className="text-lg font-semibold text-gray-800">Erstinformationen</h2>
          <p className="text-sm text-gray-500 mt-1">
            Bitte füllen Sie die folgenden Felder aus, damit wir Sie optimal betreuen können.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firmenname *</label>
            <input
              required
              value={form.companyName}
              onChange={e => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
              placeholder="Ihre Firma GmbH"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
              <input
                required
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
              <input
                required
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
                placeholder="Mustermann"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
              placeholder="+49 123 456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Straße & Hausnummer</label>
            <input
              value={form.street}
              onChange={e => setForm({ ...form, street: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
              placeholder="Musterstraße 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
              <input
                value={form.zipCode}
                onChange={e => setForm({ ...form, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
                placeholder="42103"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
              <input
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-sm"
                placeholder="Wuppertal"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Wird übermittelt..." : "Daten absenden"}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Ihre Daten werden vertraulich behandelt und nur für die Betreuung Ihres Auftrags verwendet.
          </p>
        </form>
      </div>
    </div>
  );
}
