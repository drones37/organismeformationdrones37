import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "ready" | "signing" | "success" | "expired" | "used" | "error";

const QRSignPage = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [tokenData, setTokenData] = useState<{
    id: string;
    student_name: string;
    sheet_title: string;
    formation: string;
    day: string;
    sheet_id: string;
    student_id: string;
  } | null>(null);
  const [error, setError] = useState("");

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load token data
  useEffect(() => {
    if (!token) { setStatus("error"); setError("Lien invalide."); return; }

    supabase
      .from("qr_tokens")
      .select("*")
      .eq("token", token)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setStatus("error"); setError("Lien introuvable."); return; }
        if (data.used) { setStatus("used"); return; }
        if (new Date(data.expires_at) < new Date()) { setStatus("expired"); return; }
        setTokenData(data as any);
        setStatus("ready");
      });
  }, [token]);

  // Canvas init
  useEffect(() => {
    if (status !== "ready" && status !== "signing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [status]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  }, [getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!hasDrawn || !canvasRef.current || !tokenData) return;
    setStatus("signing");

    const signatureData = canvasRef.current.toDataURL();
    const signedAt = new Date().toLocaleString("fr-FR");

    // 1. Get current signatures
    const { data: attRow } = await supabase
      .from("attendance_students")
      .select("signatures")
      .eq("sheet_id", tokenData.sheet_id)
      .eq("student_id", tokenData.student_id)
      .single();

    if (!attRow) { setStatus("error"); setError("Erreur lors de l'enregistrement."); return; }

    const currentSigs = (attRow.signatures as Record<string, { signed: boolean; signatureData?: string; signedAt?: string }>) || {};
    const newSigs = {
      ...currentSigs,
      [tokenData.day]: { signed: true, signatureData, signedAt },
    };

    // 2. Update signatures in attendance_students
    const { error: sigErr } = await supabase
      .from("attendance_students")
      .update({ signatures: newSigs })
      .eq("sheet_id", tokenData.sheet_id)
      .eq("student_id", tokenData.student_id);

    if (sigErr) { setStatus("error"); setError("Erreur lors de l'enregistrement."); return; }

    // 3. Mark token as used
    await supabase
      .from("qr_tokens")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    setStatus("success");
  };

  // ─── Render states ───────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement…</p>
        </div>
      </div>
    );
  }

  if (status === "used") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✋</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Déjà signé</h1>
          <p className="text-gray-500 text-sm">Ce lien a déjà été utilisé. Votre signature a bien été enregistrée.</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏰</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Lien expiré</h1>
          <p className="text-gray-500 text-sm">Ce lien de signature a expiré (validité 24h). Demandez un nouveau QR code à votre formateur.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Signature enregistrée !</h1>
          <p className="text-gray-600 text-sm mb-1">
            <span className="font-semibold">{tokenData?.student_name}</span>
          </p>
          <p className="text-gray-500 text-sm">
            {tokenData?.formation} — {tokenData?.day}<br />
            {new Date().toLocaleString("fr-FR")}
          </p>
          <p className="text-green-600 text-sm mt-4 font-medium">Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Erreur</h1>
          <p className="text-gray-500 text-sm">{error || "Une erreur est survenue."}</p>
        </div>
      </div>
    );
  }

  // ─── Ready / Signing ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">D</div>
        <div>
          <p className="font-bold text-sm">DRONES37</p>
          <p className="text-blue-300 text-xs">Émargement en ligne</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-4 pt-6 gap-5 max-w-md mx-auto w-full">
        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Feuille d'émargement</p>
          <h1 className="text-lg font-bold text-gray-800 mb-1">{tokenData?.sheet_title}</h1>
          <p className="text-gray-500 text-sm mb-3">{tokenData?.formation}</p>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 rounded-xl px-4 py-2 flex-1 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Stagiaire</p>
              <p className="font-semibold text-gray-800 text-sm">{tokenData?.student_name}</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2 flex-1 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Journée</p>
              <p className="font-semibold text-blue-700 text-sm">{tokenData?.day}</p>
            </div>
          </div>
        </div>

        {/* Signature zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            ✍️ Signez dans le cadre ci-dessous
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              className="w-full touch-none"
              style={{ display: "block", cursor: "crosshair" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-sm select-none">Tracez votre signature ici</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={clearCanvas}
              className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Effacer
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn || status === "signing"}
              className="flex-1 py-2.5 text-sm rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "signing" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "✅ Valider ma signature"
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          Ce lien est personnel et à usage unique. Il expire dans 24h.
        </p>
      </div>
    </div>
  );
};

export default QRSignPage;
