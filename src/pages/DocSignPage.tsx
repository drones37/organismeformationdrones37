import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SignatureCanvas from "@/components/SignatureCanvas";
import { Check } from "lucide-react";

const DOC_LABELS: Record<string, string> = {
  livret: "Livret d'accueil",
  convention: "Convention de formation",
  attestation: "Attestation de formation",
};

const DocSignPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [info, setInfo] = useState<{ studentId: string; studentName: string; docType: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase
        .from("doc_sign_tokens")
        .select("student_id, student_name, doc_type, used, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) { setError("Lien invalide."); setLoading(false); return; }
      if (data.used) { setError("Ce lien a déjà été utilisé."); setLoading(false); return; }
      if (new Date(data.expires_at) < new Date()) { setError("Ce lien a expiré."); setLoading(false); return; }
      setInfo({ studentId: data.student_id, studentName: data.student_name, docType: data.doc_type });
      setLoading(false);
    })();
  }, [token]);

  const handleSave = async (dataUrl: string) => {
    if (!info || !token) return;
    // Read existing signatures
    const { data: stu } = await supabase
      .from("students")
      .select("doc_signatures")
      .eq("id", info.studentId)
      .maybeSingle();
    const sigs: any = stu?.doc_signatures || {};
    sigs[info.docType] = { student: dataUrl, signedAt: new Date().toISOString() };
    const { error: upErr } = await supabase
      .from("students")
      .update({ doc_signatures: sigs })
      .eq("id", info.studentId);
    if (upErr) { setError("Erreur lors de l'enregistrement de la signature."); return; }
    await supabase.from("doc_sign_tokens").update({ used: true, used_at: new Date().toISOString() }).eq("token", token);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-xl font-heading font-bold">Signature enregistrée</h2>
          <p className="text-sm text-muted-foreground">Merci, votre signature a bien été transmise au formateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Signature électronique</p>
          <h1 className="text-xl font-heading font-bold">{DOC_LABELS[info!.docType] || info!.docType}</h1>
          <p className="text-sm text-muted-foreground">{info!.studentName}</p>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          En signant ci-dessous, vous reconnaissez avoir pris connaissance du document et l'acceptez.
        </p>
        <SignatureCanvas onSave={handleSave} onCancel={() => window.close()} />
      </div>
    </div>
  );
};

export default DocSignPage;