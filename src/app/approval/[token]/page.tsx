"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";

export default function ApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [comment, setComment] = useState("");
  const [sigName, setSigName] = useState("");
  const [sigEmail, setSigEmail] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => { api.approval(token).then(setQuote).catch(() => setErr("Link ungueltig oder abgelaufen")); }, [token]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: e.nativeEvent.offsetX * scaleX, y: e.nativeEvent.offsetY * scaleY };
  }, []);

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    const pos = getPos(e);
    if (ctx) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const pos = getPos(e);
    if (ctx) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  }
  function stopDraw(e: React.MouseEvent | React.TouchEvent) { e.preventDefault(); setDrawing(false); }
  function clearSig() { const ctx = canvasRef.current?.getContext("2d"); if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }

  async function handleApproval(accepted: boolean) {
    const sigData = accepted ? canvasRef.current?.toDataURL("image/png") : undefined;
    await api.processApproval(token, { accepted, comment, signatureData: sigData, signedByName: sigName, signedByEmail: sigEmail });
    setDone(true);
  }

  if (err) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-danger mb-2">Fehler</h1><p className="text-muted">{err}</p></div></div>;
  if (!quote) return <div className="min-h-screen flex items-center justify-center"><p>Laden...</p></div>;
  if (done) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-success mb-2">Vielen Dank!</h1><p className="text-muted">Ihre Rueckmeldung wurde gespeichert.</p></div></div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-surface rounded-xl border border-border p-8">
          <div className="flex justify-between items-start mb-6">
            <div><h1 className="text-2xl font-bold">Angebot {quote.quoteNumber}</h1><p className="text-muted">Version {quote.version}</p></div>
            <span className={`text-xs px-3 py-1 rounded-full ${quote.status === "Viewed" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-muted"}`}>{quote.status}</span>
          </div>
          {quote.subject && <h2 className="text-lg font-semibold mb-4">{quote.subject}</h2>}
          {quote.introText && <p className="text-muted mb-6">{quote.introText}</p>}

          <h3 className="font-semibold mb-3">Positionen</h3>
          <table className="w-full mb-6">
            <thead><tr className="border-b border-border"><th className="py-2 text-left text-sm text-muted">Leistung</th><th className="py-2 text-right text-sm text-muted">Menge</th><th className="py-2 text-right text-sm text-muted">Preis</th><th className="py-2 text-right text-sm text-muted">Gesamt</th></tr></thead>
            <tbody>{quote.lines?.map((l: any) => (
              <tr key={l.id} className="border-b border-border"><td className="py-2"><p className="font-medium">{l.title}</p>{l.description && <p className="text-xs text-muted">{l.description}</p>}<span className="text-xs text-muted">{l.lineType === "RecurringMonthly" ? "monatlich" : "einmalig"}</span></td><td className="py-2 text-right">{l.quantity}</td><td className="py-2 text-right">{l.unitPrice?.toFixed(2)} EUR</td><td className="py-2 text-right font-medium">{l.total?.toFixed(2)} EUR</td></tr>
            ))}</tbody>
          </table>

          <div className="bg-background rounded-lg p-4 mb-6">
            <div className="flex justify-between"><span>Netto:</span><span>{quote.subtotal?.toFixed(2)} EUR</span></div>
            <div className="flex justify-between text-sm text-muted"><span>MwSt. ({quote.taxRate}%):</span><span>{quote.taxAmount?.toFixed(2)} EUR</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2"><span>Gesamt:</span><span>{quote.grandTotal?.toFixed(2)} EUR</span></div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="mb-4"><label className="block text-sm font-medium mb-1">Unterschrift</label>
              <div className="border border-border rounded-lg overflow-hidden bg-white touch-none">
                <canvas ref={canvasRef} width={600} height={150} className="w-full cursor-crosshair"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} onTouchCancel={stopDraw}
                />
              </div>
              <button onClick={clearSig} className="text-xs text-muted mt-1 hover:underline">Unterschrift loeschen</button>
            </div>
            <div className="mb-4"><label className="block text-sm font-medium mb-1">Kommentar (optional)</label><textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" rows={3} /></div>
            <div className="flex gap-3">
              <button onClick={() => handleApproval(true)} className="px-6 py-2.5 bg-success text-white rounded-lg font-medium hover:opacity-90">Angebot annehmen</button>
              <button onClick={() => handleApproval(false)} className="px-6 py-2.5 border border-danger text-danger rounded-lg font-medium hover:bg-red-50">Ablehnen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
