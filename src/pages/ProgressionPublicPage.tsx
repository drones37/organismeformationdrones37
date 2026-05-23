import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SignatureCanvas from "@/components/SignatureCanvas";
import { Star, CheckCircle2, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  name: string;
  rating_start: number | null;
  rating_end: number | null;
  status: string;
  sort_order: number;
}

interface Sheet {
  id: string;
  student_name: string;
  formation: string;
  start_date: string;
  end_date: string;
  instructor_name: string;
  observations: string | null;
  global_result: string | null;
  instructor_signature: string | null;
  student_signature: string | null;
}

const ratingStars = (n: number | null) => (
  <div className="flex gap-0.5 justify-center">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= (n || 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const ProgressionPublicPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: tk } = await supabase.from("progression_tokens").select("*").eq("token", token).maybeSingle();
      if (!tk) { setError("Lien invalide ou expiré"); setLoading(false); return; }
      if (new Date(tk.expires_at) < new Date()) { setError("Ce lien a expiré"); setLoading(false); return; }
      setTokenId(tk.id);
      const { data: s } = await supabase.from("progression_sheets").select("*").eq("id", tk.progression_id).maybeSingle();
      if (!s) { setError("Livret introuvable"); setLoading(false); return; }
      setSheet(s as any);
      if ((s as any).student_signature) setSigned(true);
      const { data: m } = await supabase.from("progression_modules").select("*").eq("progression_id", tk.progression_id).order("sort_order");
      setModules((m || []) as any);
      setLoading(false);
    })();
  }, [token]);

  const handleSign = async (dataUrl: string) => {
    if (!sheet) return;
    setSubmitting(true);
    const signedAt = new Date().toLocaleString("fr-FR");
    const { error: err } = await supabase
      .from("progression_sheets")
      .update({ student_signature: dataUrl, student_signed_at: signedAt } as any)
      .eq("id", sheet.id);
    if (err) { toast.error("Erreur lors de l'enregistrement"); setSubmitting(false); return; }
    if (tokenId) {
      await supabase.from("progression_tokens").update({ used: true, used_at: new Date().toISOString() }).eq("id", tokenId);
    }
    setSigned(true);
    setSubmitting(false);
    toast.success("Merci, votre signature a été enregistrée !");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-heading font-bold mb-2">Oups…</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  if (!sheet) return null;

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Livret de progression</h1>
          <p className="text-sm text-muted-foreground">DRONES37 — Organisme de formation</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-1.5 text-sm">
          <div><span className="text-muted-foreground">Stagiaire :</span> <strong>{sheet.student_name}</strong></div>
          <div><span className="text-muted-foreground">Formation :</span> {sheet.formation}</div>
          <div><span className="text-muted-foreground">Formateur :</span> {sheet.instructor_name}</div>
          <div><span className="text-muted-foreground">Période :</span> {new Date(sheet.start_date).toLocaleDateString("fr-FR")} au {new Date(sheet.end_date).toLocaleDateString("fr-FR")}</div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2.5 border-b border-border">
            <h2 className="text-sm font-heading font-semibold">Évaluation des acquis</h2>
          </div>
          <div className="divide-y divide-border">
            {modules.map(m => (
              <div key={m.id} className="p-3">
                <p className="text-sm font-medium mb-2">{m.name}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-center">Début</p>
                    {ratingStars(m.rating_start)}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-center">Fin</p>
                    {ratingStars(m.rating_end)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sheet.observations && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-sm font-heading font-semibold mb-2">Observations du formateur</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sheet.observations}</p>
          </div>
        )}

        {sheet.global_result && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Résultat global</p>
              <p className="font-semibold capitalize">{sheet.global_result.replace("_", " ")}</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="text-sm font-heading font-semibold mb-3">Votre signature</h2>
          {signed ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="font-semibold">Merci, votre signature a bien été enregistrée.</p>
              <p className="text-sm text-muted-foreground mt-1">Vous pouvez fermer cette page.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                En signant, vous attestez avoir pris connaissance du livret de progression ci-dessus.
              </p>
              {submitting ? (
                <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" /></div>
              ) : (
                <SignatureCanvas onSave={handleSign} onCancel={() => { /* no-op */ }} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressionPublicPage;