import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { reloadStore } from "@/lib/store";
import { Plus, ClipboardCheck, CheckCircle2, Clock, Lock, Download, BookOpen, Trash2, QrCode, X, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignatureCanvas from "@/components/SignatureCanvas";
import { generateAttendancePDF } from "@/lib/pdfGenerator";
import { supabase } from "@/integrations/supabase/client";

// ─── QR Code generator (pure SVG, no lib needed) ─────────────────
// We use the qrcode package via CDN-style dynamic import fallback,
// but for simplicity we generate the URL and display it via a Google Charts QR API
const getQRUrl = (text: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(text)}`;

// Always use the published public URL for signing links so QR codes work
// for students (the Lovable preview URL is auth-protected).
const PUBLIC_ORIGIN = "https://organismeformationdrones37.lovable.app";
const getPublicOrigin = () => {
  if (typeof window === "undefined") return PUBLIC_ORIGIN;
  const host = window.location.hostname;
  // Use current origin only when on the production domain or localhost dev
  if (host === "organismeformationdrones37.lovable.app" || host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  return PUBLIC_ORIGIN;
};

// ─── Types ────────────────────────────────────────────────────────
interface QRModal {
  sheetId: string;
  sheetTitle: string;
  studentId: string;
  studentName: string;
  formation: string;
  day: string;
}

const AttendancePage = () => {
  const [, forceUpdate] = useState(0);
  const [open, setOpen] = useState(false);
  const [signingFor, setSigningFor] = useState<{ sheetId: string; studentId: string; day: string } | null>(null);
  const [form, setForm] = useState({ title: "", date: "", formation: "", days: "3" });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // QR modal state
  const [qrModal, setQrModal] = useState<QRModal | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrToken, setQrToken] = useState<string>("");

  const sheets = store.getAttendance();
  const allStudents = store.getStudents();

  const handleCreate = () => {
    if (!form.title || !form.date) return;
    const days = parseInt(form.days) || 3;
    const dayKeys: Record<string, { signed: boolean }> = {};
    for (let i = 1; i <= days; i++) {
      dayKeys[`J${i}`] = { signed: false };
    }
    store.addAttendance({
      ...form,
      days,
      status: "en_cours",
      students: selectedStudents.map(id => {
        const s = allStudents.find(st => st.id === id)!;
        return {
          studentId: id,
          studentName: `${s.firstName} ${s.lastName}`,
          grade: "",
          livretVu: false,
          signatures: { ...dayKeys },
        };
      }),
    });
    setForm({ title: "", date: "", formation: "", days: "3" });
    setSelectedStudents([]);
    setOpen(false);
    forceUpdate(n => n + 1);
  };

  const handleSign = (dataUrl: string) => {
    if (!signingFor) return;
    store.signAttendance(signingFor.sheetId, signingFor.studentId, signingFor.day, dataUrl);
    setSigningFor(null);
    forceUpdate(n => n + 1);
  };

  const handleClose = (id: string) => {
    store.closeAttendance(id);
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette feuille d'émargement ?")) {
      store.deleteAttendance(id);
      forceUpdate(n => n + 1);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // ─── QR Code generation ────────────────────────────────────────
  const generateQR = async (info: QRModal) => {
    setQrModal(info);
    setQrUrl("");
    setQrToken("");
    setQrLoading(true);

    // Check if a valid (unused, non-expired) token already exists
    const { data: existing } = await supabase
      .from("qr_tokens")
      .select("*")
      .eq("sheet_id", info.sheetId)
      .eq("student_id", info.studentId)
      .eq("day", info.day)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    let token: string;

    if (existing && existing.length > 0) {
      token = existing[0].token;
    } else {
      // Create new token
      const { data: newToken, error } = await supabase
        .from("qr_tokens")
        .insert({
          sheet_id: info.sheetId,
          student_id: info.studentId,
          student_name: info.studentName,
          sheet_title: info.sheetTitle,
          formation: info.formation,
          day: info.day,
        })
        .select("token")
        .single();

      if (error || !newToken) {
        setQrLoading(false);
        alert("Erreur lors de la génération du QR code. Vérifiez que la migration SQL a été appliquée.");
        return;
      }
      token = newToken.token;
    }

    const signingUrl = `${getPublicOrigin()}/signer/${token}`;
    setQrToken(token);
    setQrUrl(getQRUrl(signingUrl));
    setQrLoading(false);
  };

  const regenerateQR = async () => {
    if (!qrModal) return;
    // Expire old tokens
    await supabase
      .from("qr_tokens")
      .update({ used: true })
      .eq("sheet_id", qrModal.sheetId)
      .eq("student_id", qrModal.studentId)
      .eq("day", qrModal.day)
      .eq("used", false);

    setQrUrl("");
    setQrToken("");
    setQrLoading(true);

    const { data: newToken, error } = await supabase
      .from("qr_tokens")
      .insert({
        sheet_id: qrModal.sheetId,
        student_id: qrModal.studentId,
        student_name: qrModal.studentName,
        sheet_title: qrModal.sheetTitle,
        formation: qrModal.formation,
        day: qrModal.day,
      })
      .select("token")
      .single();

    if (error || !newToken) { setQrLoading(false); return; }

    const signingUrl = `${getPublicOrigin()}/signer/${newToken.token}`;
    setQrToken(newToken.token);
    setQrUrl(getQRUrl(signingUrl));
    setQrLoading(false);
  };

  // Poll for signature when QR modal is open
  useEffect(() => {
    if (!qrModal || !qrToken) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("qr_tokens")
        .select("used")
        .eq("token", qrToken)
        .single();
      if (data?.used) {
        clearInterval(interval);
        // Refresh store
        await reloadStore();
        forceUpdate(n => n + 1);
        setQrModal(null);
        setQrUrl("");
        setQrToken("");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [qrModal, qrToken]);

  // ─── UI helpers ───────────────────────────────────────────────
  const statusIcons = {
    brouillon: <Clock className="w-4 h-4" />,
    en_cours: <ClipboardCheck className="w-4 h-4" />,
    cloturee: <Lock className="w-4 h-4" />,
  };
  const statusLabels = { brouillon: "Brouillon", en_cours: "En cours", cloturee: "Clôturée" };
  const statusColors = { brouillon: "text-muted-foreground", en_cours: "text-accent", cloturee: "text-success" };
  const getDayLabels = (days: number) => Array.from({ length: days }, (_, i) => `J${i + 1}`);

  const isStudentFullySigned = (s: typeof sheets[0]["students"][0]) =>
    Object.values(s.signatures).every(sig => sig.signed);

  const getSignedCount = (sheet: typeof sheets[0]) => {
    const totalSigs = sheet.students.length * sheet.days;
    const signedSigs = sheet.students.reduce((acc, s) =>
      acc + Object.values(s.signatures).filter(sig => sig.signed).length, 0);
    return { signedSigs, totalSigs };
  };

  const signingUrl = qrToken ? `${getPublicOrigin()}/signer/${qrToken}` : "";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Émargement</h1>
          <p className="text-muted-foreground mt-1">Feuilles de présence et signatures</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle feuille
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Nouvelle feuille d'émargement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Titre</Label><Input placeholder="Ex: Émargement Session Avril" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Date de début</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label>Formation</Label><Input placeholder="Ex: Scénarios S1/S2/S3" value={form.formation} onChange={e => setForm(f => ({ ...f, formation: e.target.value }))} /></div>
              <div>
                <Label>Nombre de jours</Label>
                <Select value={form.days} onValueChange={v => setForm(f => ({ ...f, days: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} jour{n > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Élèves à inclure</Label>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
                  {allStudents.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} className="rounded" />
                      {s.firstName} {s.lastName}
                      <span className="text-xs text-muted-foreground ml-auto">{s.formation}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-accent text-accent-foreground hover:opacity-90" disabled={selectedStudents.length === 0}>
                Créer la feuille
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sheets list */}
      <div className="space-y-4">
        {sheets.map(sheet => {
          const dayLabels = getDayLabels(sheet.days);
          const { signedSigs, totalSigs } = getSignedCount(sheet);

          return (
            <div key={sheet.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-heading font-semibold">{sheet.title}</h2>
                    <span className={`flex items-center gap-1 text-xs font-medium ${statusColors[sheet.status]}`}>
                      {statusIcons[sheet.status]} {statusLabels[sheet.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sheet.formation} — {new Date(sheet.date).toLocaleDateString("fr-FR")} — {sheet.days} jour{sheet.days > 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-2">
                  {sheet.status === "en_cours" && (
                    <Button variant="outline" size="sm" onClick={() => handleClose(sheet.id)}>
                      <Lock className="w-3.5 h-3.5 mr-1" /> Clôturer
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => generateAttendancePDF(sheet)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(sheet.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Stagiaire</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Grade / Fonction</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                        <span className="flex items-center justify-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Livret</span>
                      </th>
                      {dayLabels.map(day => (
                        <th key={day} className="text-center py-2 px-3 font-medium text-muted-foreground">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.students.map(s => (
                      <tr key={s.studentId} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {isStudentFullySigned(s) ? (
                              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                            )}
                            <span className="font-medium">{s.studentName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {sheet.status === "en_cours" ? (
                            <Input
                              className="h-8 text-sm"
                              placeholder="Grade / Fonction"
                              value={s.grade}
                              onChange={e => {
                                store.updateStudentGrade(sheet.id, s.studentId, e.target.value);
                                forceUpdate(n => n + 1);
                              }}
                            />
                          ) : (
                            <span className="text-sm">{s.grade || "—"}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sheet.status === "en_cours" ? (
                            <input
                              type="checkbox"
                              checked={s.livretVu}
                              onChange={() => {
                                store.toggleLivretVu(sheet.id, s.studentId);
                                forceUpdate(n => n + 1);
                              }}
                              className="rounded"
                            />
                          ) : (
                            <span>{s.livretVu ? "✓" : "—"}</span>
                          )}
                        </td>
                        {dayLabels.map(day => {
                          const sig = s.signatures[day];
                          return (
                            <td key={day} className="py-3 px-3 text-center">
                              {sig?.signed ? (
                                <div className="flex flex-col items-center gap-1">
                                  {sig.signatureData ? (
                                    <img src={sig.signatureData} alt="Signature" className="h-6 border border-border rounded" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{sig.signedAt}</span>
                                </div>
                              ) : sheet.status === "en_cours" ? (
                                <div className="flex flex-col items-center gap-1">
                                  {/* QR button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2 gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => generateQR({
                                      sheetId: sheet.id,
                                      sheetTitle: sheet.title,
                                      studentId: s.studentId,
                                      studentName: s.studentName,
                                      formation: sheet.formation,
                                      day,
                                    })}
                                  >
                                    <QrCode className="w-3 h-3" /> QR
                                  </Button>
                                  {/* Manual sign */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-[10px] h-6 px-2 text-muted-foreground"
                                    onClick={() => setSigningFor({ sheetId: sheet.id, studentId: s.studentId, day })}
                                  >
                                    Manuel
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {signedSigs}/{totalSigs} signature{totalSigs > 1 ? "s" : ""}
              </div>
            </div>
          );
        })}

        {sheets.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-heading">Aucune feuille d'émargement</p>
            <p className="text-sm mt-1">Créez votre première feuille pour commencer</p>
          </div>
        )}
      </div>

      {/* Manual signature modal */}
      <Dialog open={!!signingFor} onOpenChange={() => setSigningFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Signature {signingFor?.day && `— ${signingFor.day}`}
            </DialogTitle>
          </DialogHeader>
          <SignatureCanvas onSave={handleSign} onCancel={() => setSigningFor(null)} />
        </DialogContent>
      </Dialog>

      {/* QR Code modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> QR Code d'émargement
                </p>
                <p className="text-xs text-blue-300 mt-0.5">Valide 24h · Usage unique</p>
              </div>
              <button onClick={() => { setQrModal(null); setQrUrl(""); setQrToken(""); }} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stagiaire</span>
                  <span className="font-semibold text-gray-800">{qrModal.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Formation</span>
                  <span className="text-gray-700">{qrModal.formation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Journée</span>
                  <span className="font-semibold text-blue-600">{qrModal.day}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center">
                {qrLoading ? (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : qrUrl ? (
                  <>
                    <div className="border-4 border-[#1a1a2e] rounded-xl overflow-hidden shadow-md">
                      <img src={qrUrl} alt="QR Code" width={220} height={220} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      En attente de la signature…
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-1 animate-pulse" />
                    </p>
                  </>
                ) : null}
              </div>

              {/* Link copy */}
              {signingUrl && (
                <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-2">
                  <p className="text-xs text-blue-700 truncate flex-1 font-mono">{signingUrl}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(signingUrl); }}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setQrModal(null); setQrUrl(""); setQrToken(""); }}
                >
                  Fermer
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Montrez ce QR au stagiaire ou envoyez-lui le lien par SMS/email
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
