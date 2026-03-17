"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 8) { setError("Passwort muss mindestens 8 Zeichen lang sein."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.resetPassword({ email, token, newPassword: password });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Fehler beim Zurücksetzen."); return; }
      setDone(true);
    } catch { setError("Unbekannter Fehler."); }
    finally { setLoading(false); }
  }

  if (!email || !token) return (
    <div className="text-center">
      <p className="text-danger mb-4">Ungültiger oder abgelaufener Link.</p>
      <a href="/forgot-password" className="text-sm text-primary hover:underline">Neuen Link anfordern</a>
    </div>
  );

  return done ? (
    <div className="text-center">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-xl font-semibold mb-2">Passwort geändert</h2>
      <p className="text-muted text-sm mb-6">Ihr Passwort wurde erfolgreich zurückgesetzt.</p>
      <a href="/login" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Zum Login</a>
    </div>
  ) : (
    <>
      <h2 className="text-xl font-semibold mb-2">Neues Passwort</h2>
      <p className="text-sm text-muted mb-6">Wählen Sie ein neues Passwort für <strong>{email}</strong>.</p>
      {error && <div className="bg-red-50 text-danger px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Neues Passwort</label>
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mindestens 8 Zeichen" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Passwort bestätigen</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Passwort wiederholen" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium disabled:opacity-50">
          {loading ? "Speichert..." : "Passwort speichern"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">GentleSuite</h1>
        </div>
        <div className="bg-surface rounded-xl border border-border p-8 shadow-sm">
          <Suspense fallback={<div className="text-center text-muted">Lädt...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
