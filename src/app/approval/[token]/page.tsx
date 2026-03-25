"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { QuoteDetail } from "@/types/api";

export default function ApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [sigName, setSigName] = useState("");
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [typedSig, setTypedSig] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [comment, setComment] = useState("");
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const signRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.approval(token)
      .then((q) => {
        setQuote(q);
        return api.quotePdfBlob(q.id);
      })
      .then((blob) => {
        setPdfUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        setExpired(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (sigMode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [sigMode]);

  function getPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  }

async function downloadSignedPdf() {
  if (!quote) return;
  setDownloading(true);
  try {
    const blob = await api.approvalPdfBlob(token);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Angebot-${quote.quoteNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    alert("PDF konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut.");
  } finally {
    setDownloading(false);
  }
}


  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    isDrawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    isDrawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function getSignatureDataUrl(): string | null {
    if (sigMode === "draw") {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const hasContent = Array.from(data).some((v, i) => i % 4 !== 3 && v < 250);
      if (!hasContent) return null;
      return canvas.toDataURL("image/png");
    }
    if (!typedSig.trim()) return null;
    const offscreen = document.createElement("canvas");
    offscreen.width = 400;
    offscreen.height = 100;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.font = "italic 36px Georgia, serif";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(typedSig, 20, 65);
    return offscreen.toDataURL("image/png");
  }

  async function handleSign() {
    if (!sigName.trim()) {
      alert("Bitte geben Sie Ihren Namen ein.");
      return;
    }
    const sigData = getSignatureDataUrl();
    if (!sigData) {
      alert("Bitte unterschreiben Sie im Feld.");
      return;
    }
    setSubmitting(true);
    try {
      await api.processApproval(token, {
        accepted: true,
        signatureData: sigData,
        signedByName: sigName,
        signedByEmail: quote?.primaryContactEmail ?? "",
        comment: "",
      });
      setDone(true);
    } catch {
      alert("Fehler beim Speichern. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!comment.trim()) {
      alert("Bitte geben Sie einen Ablehnungsgrund an.");
      return;
    }
    setSubmitting(true);
    try {
      await api.processApproval(token, { accepted: false, comment });
      setDeclined(true);
    } catch {
      alert("Fehler beim Speichern. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center text-white text-center px-4">
        <div>
          <p className="text-2xl font-semibold mb-2">Link abgelaufen</p>
          <p className="text-slate-400 text-sm">
            Dieser Angebots-Link ist nicht mehr gültig. Bitte kontaktieren Sie uns.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center text-white text-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-2xl font-semibold mb-2">Angebot angenommen</p>
          <p className="text-slate-400 text-sm mb-8">
            Vielen Dank. Ihre Unterschrift wurde erfolgreich gespeichert.
          </p>
          <button
            onClick={downloadSignedPdf}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Wird geladen…
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
                Angebot als PDF herunterladen
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center text-white text-center px-4">
        <div>
          <p className="text-2xl font-semibold mb-2">Angebot abgelehnt</p>
          <p className="text-slate-400 text-sm">
            Wir haben Ihre Rückmeldung erhalten und werden uns bei Ihnen melden.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative w-40 h-40 mb-6">
            <div className="absolute inset-0 rounded-full bg-[#2a3147]" />
            <div className="absolute inset-4 rounded-full bg-[#3b4568]" />
            <div className="absolute inset-0 flex items-center justify-center text-7xl select-none">
              📋
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Angebot</h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Vielen Dank für Ihr Interesse. Bitte prüfen Sie das nachfolgende Dokument sorgfältig.
            Wenn Sie damit einverstanden sind, unterschreiben Sie es am Ende mittels digitaler Signatur.
            Im Anschluss können Sie das Dokument als PDF herunterladen.
          </p>
          <button
            onClick={() => signRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Jetzt unterschreiben <span>↓</span>
          </button>
        </div>

        {pdfUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-700 mb-8">
            <div className="bg-[#252b3b] flex items-center justify-between px-4 py-2 text-sm text-slate-300">
              <span>PDF-Ansicht</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  className="hover:text-white px-1"
                >
                  ‹
                </button>
                <span>{pdfPage}</span>
                <button
                  onClick={() => setPdfPage((p) => p + 1)}
                  className="hover:text-white px-1"
                >
                  ›
                </button>
                <a
                  href={pdfUrl}
                  download={`Angebot-${quote?.quoteNumber ?? ""}.pdf`}
                  className="hover:text-white ml-2"
                  title="Herunterladen"
                >
                  ⬇
                </a>
              </div>
            </div>
            <div className="bg-[#2a3147] p-4">
              <iframe
                src={`${pdfUrl}#page=${pdfPage}`}
                className="w-full rounded bg-white"
                style={{ height: "700px", border: "none" }}
                title="Angebot PDF"
              />
            </div>
          </div>
        )}

        <div ref={signRef} className="bg-[#252b3b] rounded-xl p-6 border border-slate-700">

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Ihr Name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={sigName}
              onChange={(e) => setSigName(e.target.value)}
              placeholder={quote?.customerName ?? "Vor- und Nachname, Unternehmen"}
              className="w-full bg-[#1a1f2e] border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Pad für neue Unterschrift
            </label>
          </div>

          <div className="relative border border-indigo-500 rounded-lg overflow-hidden bg-white mb-3">
            <button
              onClick={clearCanvas}
              className="absolute top-2 right-2 z-10 text-slate-400 hover:text-slate-600 text-lg leading-none"
              title="Zurücksetzen"
              type="button"
            >
              ↺
            </button>

            {sigMode === "draw" ? (
              <>
                <div className="absolute top-3 left-4 text-slate-400 text-xs pointer-events-none select-none">
                  {today}
                </div>
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={160}
                  className="w-full cursor-crosshair touch-none block"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </>
            ) : (
              <div className="p-4 h-40 flex items-end">
                <input
                  type="text"
                  value={typedSig}
                  onChange={(e) => setTypedSig(e.target.value)}
                  placeholder="Hier tippen…"
                  className="w-full border-b border-slate-300 bg-transparent text-slate-800 text-2xl italic focus:outline-none pb-1"
                  style={{ fontFamily: "Georgia, serif" }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSigMode("draw")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sigMode === "draw"
                  ? "bg-indigo-600 text-white"
                  : "bg-[#1a1f2e] text-slate-400 hover:text-white border border-slate-600"
              }`}
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={() => setSigMode("type")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sigMode === "type"
                  ? "bg-indigo-600 text-white"
                  : "bg-[#1a1f2e] text-slate-400 hover:text-white border border-slate-600"
              }`}
            >
              T
            </button>
          </div>

          <button
            type="button"
            onClick={handleSign}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mb-6"
          >
            {submitting ? "Wird gespeichert…" : "Jetzt unterschreiben"}
          </button>

          <details className="group">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 list-none flex items-center gap-1 select-none">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Angebot ablehnen
            </summary>
            <div className="mt-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Bitte geben Sie einen Ablehnungsgrund an…"
                className="w-full bg-[#1a1f2e] border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none mb-3"
              />
              <button
                type="button"
                onClick={handleDecline}
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Angebot ablehnen
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
