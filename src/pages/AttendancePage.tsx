import { useState } from "react";
import { store } from "@/lib/store";
import { Plus, ClipboardCheck, CheckCircle2, Clock, Lock, Download, BookOpen, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignatureCanvas from "@/components/SignatureCanvas";
import { generateAttendancePDF } from "@/lib/pdfGenerator";

const AttendancePage = () => {
  const [, forceUpdate] = useState(0);
  const [open, setOpen] = useState(false);
  const [signingFor, setSigningFor] = useState<{ sheetId: string; studentId: string; day: string } | null>(null);
  const [form, setForm] = useState({ title: "", date: "", formation: "", days: "3" });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

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

  const statusIcons = {
    brouillon: <Clock className="w-4 h-4" />,
    en_cours: <ClipboardCheck className="w-4 h-4" />,
    cloturee: <Lock className="w-4 h-4" />,
  };

  const statusLabels = {
    brouillon: "Brouillon",
    en_cours: "En cours",
    cloturee: "Clôturée",
  };

  const statusColors = {
    brouillon: "text-muted-foreground",
    en_cours: "text-accent",
    cloturee: "text-success",
  };

  const getDayLabels = (days: number) => Array.from({ length: days }, (_, i) => `J${i + 1}`);

  const isStudentFullySigned = (s: typeof sheets[0]["students"][0]) => {
    return Object.values(s.signatures).every(sig => sig.signed);
  };

  const getSignedCount = (sheet: typeof sheets[0]) => {
    const totalSigs = sheet.students.length * sheet.days;
    const signedSigs = sheet.students.reduce((acc, s) =>
      acc + Object.values(s.signatures).filter(sig => sig.signed).length, 0);
    return { signedSigs, totalSigs };
  };

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

              {/* Table view */}
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2"
                                  onClick={() => setSigningFor({ sheetId: sheet.id, studentId: s.studentId, day })}
                                >
                                  Signer
                                </Button>
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

      {/* Signature modal */}
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
    </div>
  );
};

export default AttendancePage;
