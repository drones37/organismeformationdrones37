import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────
interface TokenData {
  id: string;
  token: string;
  student_id: string;
  student_name: string;
  formation: string;
  type: "chaud" | "froid";
  satisfaction_id: string;
  used: boolean;
  expires_at: string;
}

interface Question {
  id: string;
  text: string;
  rating: number;
  sort_order: number;
}

type Status = "loading" | "ready" | "submitting" | "success" | "used" | "expired" | "error";

const QUESTIONS_CHAUD = [
  "Qualité du contenu pédagogique",
  "Compétence du formateur",
  "Clarté des explications",
  "Adéquation de la formation avec vos attentes",
  "Qualité du matériel utilisé",
  "Organisation générale",
];

const QUESTIONS_FROID = [
  "J'utilise les compétences acquises dans mon activité professionnelle",
  "Je me sens autonome dans l'utilisation du drone en conditions professionnelles",
  "J'applique correctement la réglementation et les règles de sécurité",
  "La formation a amélioré mon efficacité professionnelle",
  "La formation a eu un impact professionnel positif",
];

// ─── Star rating component ─────────────────────────────────────────
const StarRating = ({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          className={`text-2xl transition-transform ${!disabled ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={
              star <= (hovered || value)
                ? "text-yellow-400"
                : "text-gray-200"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────
const SatisfactionPublicPage = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("Lien invalide."); return; }
    loadToken();
  }, [token]);

  const loadToken = async () => {
    // Load token
    const { data: tok, error: tokErr } = await supabase
      .from("satisfaction_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokErr || !tok) { setStatus("error"); setError("Lien introuvable."); return; }
    if (tok.used) { setStatus("used"); return; }
    if (new Date(tok.expires_at) < new Date()) { setStatus("expired"); return; }

    setTokenData(tok as TokenData);

    // Load questions for this satisfaction
    const { data: qs } = await supabase
      .from("satisfaction_questions")
      .select("*")
      .eq("satisfaction_id", tok.satisfaction_id)
      .order("sort_order");

    if (qs && qs.length > 0) {
      setQuestions(qs as Question[]);
      const initRatings: Record<string, number> = {};
      qs.forEach((q: Question) => { initRatings[q.id] = q.rating || 0; });
      setRatings(initRatings);
    } else {
      // Build from template
      const templateTexts = tok.type === "chaud" ? QUESTIONS_CHAUD : QUESTIONS_FROID;
      const builtQs: Question[] = templateTexts.map((text, i) => ({
        id: `${tok.satisfaction_id}_${tok.type}_${i}`,
        text,
        rating: 0,
        sort_order: i,
      }));
      setQuestions(builtQs);
      const initRatings: Record<string, number> = {};
      builtQs.forEach(q => { initRatings[q.id] = 0; });
      setRatings(initRatings);
    }

    setStatus("ready");
  };

  const allAnswered = questions.length > 0 && questions.every(q => (ratings[q.id] || 0) > 0);

  const globalScore = (() => {
    const vals = Object.values(ratings).filter(v => v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  const handleSubmit = async () => {
    if (!allAnswered || !tokenData) return;
    setStatus("submitting");

    // Upsert questions with ratings
    const upserts = questions.map(q => ({
      id: q.id,
      satisfaction_id: tokenData.satisfaction_id,
      text: q.text,
      rating: ratings[q.id] || 0,
      sort_order: q.sort_order,
    }));

    const { error: upsertErr } = await supabase
      .from("satisfaction_questions")
      .upsert(upserts, { onConflict: "id" });

    if (upsertErr) { setStatus("error"); setError("Erreur lors de l'enregistrement."); return; }

    // Update comment on satisfaction_responses
    if (comment.trim()) {
      await supabase
        .from("satisfaction_responses")
        .update({ comment })
        .eq("id", tokenData.satisfaction_id);
    }

    // Mark token as used
    await supabase
      .from("satisfaction_tokens")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    setStatus("success");
  };

  // ─── States ────────────────────────────────────────────────────

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (status === "used") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">✋</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Déjà répondu</h1>
        <p className="text-gray-500 text-sm">Vous avez déjà rempli ce questionnaire. Merci !</p>
      </div>
    </div>
  );

  if (status === "expired") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⏰</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Lien expiré</h1>
        <p className="text-gray-500 text-sm">Ce lien a expiré. Contactez votre formateur pour en obtenir un nouveau.</p>
      </div>
    </div>
  );

  if (status === "success") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Merci !</h1>
        <p className="text-gray-600 text-sm mb-4">
          Votre satisfaction a bien été enregistrée.
        </p>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-3xl font-bold text-yellow-500 mb-1">
            {globalScore.toFixed(1)}/5
          </p>
          <div className="flex justify-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-xl ${s <= Math.round(globalScore) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
            ))}
          </div>
        </div>
        <p className="text-green-600 text-sm mt-4 font-medium">Vous pouvez fermer cette page.</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Erreur</h1>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  // ─── Form ──────────────────────────────────────────────────────
  const typeLabel = tokenData?.type === "chaud" ? "À CHAUD" : "À FROID";
  const typeColor = tokenData?.type === "chaud" ? "bg-orange-500" : "bg-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">D</div>
        <div>
          <p className="font-bold text-sm">DRONES37</p>
          <p className="text-blue-300 text-xs">Questionnaire de satisfaction</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-4 pt-6 gap-5 max-w-lg mx-auto w-full pb-10">
        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${typeColor}`}>
              {typeLabel}
            </span>
            <span className="text-xs text-gray-400">Questionnaire de satisfaction</span>
          </div>
          <h1 className="text-lg font-bold text-gray-800 mb-1">{tokenData?.formation}</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="bg-gray-50 rounded-xl px-4 py-2 flex-1 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Stagiaire</p>
              <p className="font-semibold text-gray-800 text-sm">{tokenData?.student_name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-2 flex-1 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Date</p>
              <p className="font-semibold text-gray-800 text-sm">{new Date().toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full space-y-5">
          <p className="text-sm font-semibold text-gray-700">
            Notez chaque critère de 1 (insuffisant) à 5 (excellent)
          </p>
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-600 mr-2">{idx + 1}.</span>
                {q.text}
              </p>
              <div className="flex items-center gap-3">
                <StarRating
                  value={ratings[q.id] || 0}
                  onChange={v => setRatings(r => ({ ...r, [q.id]: v }))}
                  disabled={status === "submitting"}
                />
                {(ratings[q.id] || 0) > 0 && (
                  <span className="text-xs text-gray-400">
                    {["", "Insuffisant", "Passable", "Bien", "Très bien", "Excellent"][ratings[q.id]]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Score preview */}
        {Object.values(ratings).some(v => v > 0) && (
          <div className="bg-yellow-50 rounded-2xl p-4 w-full text-center border border-yellow-100">
            <p className="text-xs text-gray-400 mb-1">Satisfaction globale</p>
            <p className="text-2xl font-bold text-yellow-500">{globalScore.toFixed(1)}/5</p>
            <p className="text-sm text-gray-500">{Math.round(globalScore / 5 * 100)}%</p>
          </div>
        )}

        {/* Comment */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
          <label className="text-sm font-semibold text-gray-700 block mb-2">
            Commentaires / Suggestions <span className="text-gray-400 font-normal">(facultatif)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Vos remarques, suggestions d'amélioration..."
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || status === "submitting"}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
        >
          {status === "submitting" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement…
            </>
          ) : (
            "✅ Valider mon questionnaire"
          )}
        </button>
        {!allAnswered && (
          <p className="text-xs text-gray-400 text-center -mt-2">
            Répondez à toutes les questions pour valider
          </p>
        )}

        <p className="text-xs text-gray-400 text-center pb-2">
          Ce lien est personnel et à usage unique.
        </p>
      </div>
    </div>
  );
};

export default SatisfactionPublicPage;
