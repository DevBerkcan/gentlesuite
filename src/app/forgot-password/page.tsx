"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">GentleSuite</h1>
          <p className="text-muted mt-2">Passwort zurücksetzen</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-xl font-semibold mb-2">E-Mail gesendet</h2>
              <p className="text-muted text-sm mb-6">Falls ein Konto mit dieser E-Mail existiert, erhalten Sie in Kürze einen Link zum Zurücksetzen Ihres Passworts.</p>
              <a href="/login" className="text-sm text-primary hover:underline">Zurück zum Login</a>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Passwort vergessen?</h2>
              <p className="text-sm text-muted mb-6">Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">E-Mail</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ihre@email.de" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium disabled:opacity-50">
                  {loading ? "Sendet..." : "Link anfordern"}
                </button>
              </form>
              <div className="text-center mt-4">
                <a href="/login" className="text-sm text-muted hover:text-primary">Zurück zum Login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
