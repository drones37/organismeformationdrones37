import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { reloadStore } from "@/lib/store";
import { Plus, QrCode, X, RefreshCw, Star, TrendingUp, MessageSquare, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const getQRUrl = (text: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(text)}`;

interface QRModal {
  satisfactionId: string;
  studentName: string;
  formation: string;
  type: "chaud" | "froid";
  token?: string;
}

const SatisfactionPage = () => {
  const [, forceUpdate] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: "", type: "chaud" as "chaud" | "froid" });
  const [qrModal, setQrModal] = useState<QRModal | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chaud" | "froid">("chaud");

  // Always refresh from Supabase on mount so newly-added or remotely-completed
  // questionnaires appear even if local state was stale.
  useEffect(() => {
    reloadStore().then(() => forceUpdate(n => n + 1));
  }, []);

  const allStudents = store.getStudents();
  const satisfactions = store.getSatisfactions();
  const chaudStats = store.getSatisfactionStats("chaud");
  const froidStats = store.getSatisfactionStats("froid");

  const filtered = satisfactions.filter(s => s.type === activeTab);

  const handleCreate = () => {
    if (!form.studentId) return;
    const student = allStudents.find(s => s.id === form.studentId);
    if (!student) return;

    store.addSatisfaction({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      formation: student.formation,
      type: form.type,
      date: new Date().toISOString().split("T")[0],
      comment: "",
    });
    setForm({ studentId: "", type: "chaud" });
    setOpen(false);
    forceUpdate(n => n + 1);
  };

  // Generate QR for satisfaction
  const generateQR = async (info: QRModal) => {
    setQrModal(info);
    setQrUrl("");
    setQrToken("");
    setQrLoading(true);

    // Check for existing valid token
    const { data: existing } = await supabase
      .from("satisfaction_tokens")
      .select("*")
      .eq("satisfaction_id", info.satisfactionId)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    let token: string;

    if (existing && existing.length > 0) {
      token = existing[0].token;
    } else {
      const { data: newToken, error } = await supabase
        .from("satisfaction_tokens")
        .insert({
          satisfaction_id: info.satisfactionId,
          student_id: info.token || "",
          student_name: info.studentName,
          formation: info.formation,
          type: info.type,
        })
        .select("token, id")
        .single();

      if (error || !newToken) {
        setQrLoading(false);
        alert("Erreur lors de la génération. Vérifiez que la migration SQL a été appliquée.");
        return;
      }
      token = newToken.token;
    }

    const url = `${window.location.origin}/satisfaction/${token}`;
    setQrToken(token);
    setQrUrl(getQRUrl(url));
    setQrLoading(false);
  };

  const regenerateQR = async () => {
    if (!qrModal) return;
    await supabase
      .from("satisfaction_tokens")
      .update({ used: true })
      .eq("satisfaction_id", qrModal.satisfactionId)
      .eq("used", false);

    setQrUrl("");
    setQrToken("");
    setQrLoading(true);

    const { data: newToken } = await supabase
      .from("satisfaction_tokens")
      .insert({
        satisfaction_id: qrModal.satisfactionId,
        student_id: qrModal.token || "",
        student_name: qrModal.studentName,
        formation: qrModal.formation,
        type: qrModal.type,
      })
      .select("token")
      .single();

    if (newToken) {
      const url = `${window.location.origin}/satisfaction/${newToken.token}`;
      setQrToken(newToken.token);
      setQrUrl(getQRUrl(url));
    }
    setQrLoading(false);
  };

  // Poll for completion
  useEffect(() => {
    if (!qrToken) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("satisfaction_tokens")
        .select("used")
        .eq("token", qrToken)
        .single();
      if (data?.used) {
        clearInterval(interval);
        await reloadStore();
        forceUpdate(n => n + 1);
        setQrModal(null);
        setQrUrl("");
        setQrToken("");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [qrToken]);

  const signingUrl = qrToken ? `${window.location.origin}/satisfaction/${qrToken}` : "";

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Satisfaction</h1>
          <p className="text-muted-foreground mt-1">Questionnaires à chaud et à froid</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Nouveau questionnaire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Nouveau questionnaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Stagiaire</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un stagiaire" /></SelectTrigger>
                  <SelectContent>
                    {allStudents.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} — {s.formation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as "chaud" | "froid" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chaud">🔥 À chaud (fin de formation)</SelectItem>
                    <SelectItem value="froid">❄️ À froid (3 mois après)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full bg-accent text-accent-foreground hover:opacity-90" disabled={!form.studentId}>
                Créer le questionnaire
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-orange-500 font-bold text-sm">🔥 À CHAUD</span>
          </div>
          <p className="text-3xl font-bold">{chaudStats.average.toFixed(1)}<span className="text-lg text-muted-foreground">/5</span></p>
          <p className="text-sm text-muted-foreground">{Math.round(chaudStats.percentage)}% de satisfaction</p>
          <p className="text-xs text-muted-foreground mt-1">{chaudStats.count} questionnaire{chaudStats.count > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-500 font-bold text-sm">❄️ À FROID</span>
          </div>
          <p className="text-3xl font-bold">{froidStats.average.toFixed(1)}<span className="text-lg text-muted-foreground">/5</span></p>
          <p className="text-sm text-muted-foreground">{Math.round(froidStats.percentage)}% de satisfaction</p>
          <p className="text-xs text-muted-foreground mt-1">{froidStats.count} questionnaire{froidStats.count > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["chaud", "froid"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "chaud" ? "🔥 À chaud" : "❄️ À froid"}
            <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5">
              {satisfactions.filter(s => s.type === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(s => {
          const avg = s.questions.length > 0
            ? s.questions.reduce((acc, q) => acc + q.rating, 0) / s.questions.filter(q => q.rating > 0).length || 0
            : 0;
          const pct = Math.round(avg / 5 * 100);
          const answered = s.questions.filter(q => q.rating > 0).length;
          const total = s.questions.length;

          return (
            <div key={s.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.studentName}</h3>
                  <p className="text-sm text-muted-foreground">{s.formation} — {new Date(s.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {answered === total && total > 0 ? (
                    <div className="text-right">
                      <p className="text-lg font-bold">{avg.toFixed(1)}/5</p>
                      {renderStars(avg)}
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => generateQR({
                        satisfactionId: s.id,
                        studentName: s.studentName,
                        formation: s.formation,
                        type: s.type,
                        token: s.studentId,
                      })}
                    >
                      <QrCode className="w-3.5 h-3.5" /> Envoyer QR
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { store.deleteSatisfaction(s.id); forceUpdate(n => n + 1); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {answered > 0 && (
                <div className="mt-3 space-y-1.5">
                  {s.questions.map(q => (
                    <div key={q.id} className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground flex-1 truncate">{q.text}</span>
                      {q.rating > 0 ? (
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-3 h-3 ${star <= q.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {s.comment && (
                <div className="mt-3 bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {s.comment}
                  </p>
                </div>
              )}

              {answered < total && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(answered/total)*100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{answered}/{total} réponses</span>
                  <button
                    onClick={() => generateQR({
                      satisfactionId: s.id,
                      studentName: s.studentName,
                      formation: s.formation,
                      type: s.type,
                      token: s.studentId,
                    })}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Renvoyer le lien
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-heading">Aucun questionnaire {activeTab === "chaud" ? "à chaud" : "à froid"}</p>
            <p className="text-sm mt-1">Créez un questionnaire et envoyez-le par QR code</p>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`text-white px-5 py-4 flex items-center justify-between ${qrModal.type === "chaud" ? "bg-orange-500" : "bg-blue-600"}`}>
              <div>
                <p className="font-bold flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Questionnaire {qrModal.type === "chaud" ? "à chaud 🔥" : "à froid ❄️"}
                </p>
                <p className="text-xs opacity-80 mt-0.5">Valide 7 jours · Usage unique</p>
              </div>
              <button onClick={() => { setQrModal(null); setQrUrl(""); setQrToken(""); }} className="opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stagiaire</span>
                  <span className="font-semibold text-gray-800">{qrModal.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Formation</span>
                  <span className="text-gray-700">{qrModal.formation}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                {qrLoading ? (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : qrUrl ? (
                  <>
                    <div className={`border-4 rounded-xl overflow-hidden shadow-md ${qrModal.type === "chaud" ? "border-orange-500" : "border-blue-600"}`}>
                      <img src={qrUrl} alt="QR Code" width={220} height={220} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      En attente de la réponse…
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-1 animate-pulse" />
                    </p>
                  </>
                ) : null}
              </div>

              {signingUrl && (
                <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-2">
                  <p className="text-xs text-blue-700 truncate flex-1 font-mono">{signingUrl}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(signingUrl)}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex-shrink-0 hover:bg-blue-700"
                  >
                    Copier
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={regenerateQR}>
                  <RefreshCw className="w-3.5 h-3.5" /> Nouveau lien
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setQrModal(null); setQrUrl(""); setQrToken(""); }}>
                  Fermer
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Montrez ce QR ou envoyez le lien par SMS/email
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatisfactionPage;
