import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store, ProgressionModule, Document } from "@/lib/store";
import { FORMATION_TYPES } from "@/lib/formationModules";
import { ArrowLeft, User, Mail, Phone, Calendar, BookOpen, ClipboardCheck, FileText, Download, Plus, Star, CheckCircle2, Clock, XCircle, AlertCircle, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignatureCanvas from "@/components/SignatureCanvas";
import { generateAttestationPDF, generateProgressionPDF, generateAttendancePDF } from "@/lib/pdfGenerator";

const statusLabels: Record<string, string> = {
  en_cours: "En cours",
  terminee: "Terminée",
  a_venir: "À venir",
};

const statusVariants: Record<string, string> = {
  en_cours: "bg-accent/15 text-accent border-accent/30",
  terminee: "bg-success/15 text-success border-success/30",
  a_venir: "bg-primary/15 text-primary border-primary/30",
};

const moduleStatusConfig: Record<ProgressionModule["status"], { label: string; icon: typeof CheckCircle2; color: string }> = {
  acquis: { label: "Acquis", icon: CheckCircle2, color: "text-success" },
  en_cours: { label: "En cours", icon: Clock, color: "text-warning" },
  non_acquis: { label: "Non acquis", icon: XCircle, color: "text-destructive" },
  non_evalue: { label: "Non évalué", icon: AlertCircle, color: "text-muted-foreground" },
};

const categoryLabels: Record<Document["category"], string> = {
  convention: "Convention",
  attestation: "Attestation",
  programme: "Programme",
  facture: "Facture / Devis",
  emargement: "Émargement",
  questionnaire: "Questionnaire",
  autre: "Autre",
};

const categoryColors: Record<Document["category"], string> = {
  convention: "bg-primary/10 text-primary",
  attestation: "bg-success/10 text-success",
  programme: "bg-accent/10 text-accent",
  facture: "bg-warning/10 text-warning",
  emargement: "bg-primary/10 text-primary",
  questionnaire: "bg-accent/10 text-accent",
  autre: "bg-muted text-muted-foreground",
};

const RatingStars = ({ value, onChange }: { value?: number; onChange: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} onClick={() => onChange(n)} className="p-0.5 hover:scale-110 transition-transform">
        <Star className={`w-4 h-4 ${n <= (value || 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const StudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const [signingFor, setSigningFor] = useState<{ sheetId: string; studentId: string; day: string } | null>(null);
  const [openCreateProgression, setOpenCreateProgression] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState("");

  const student = store.getStudents().find(s => s.id === id);
  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Élève introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/eleves")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  // Get related data
  const progression = store.getProgressionByStudent(student.id);
  const attendanceSheets = store.getAttendance().filter(a =>
    a.students.some(s => s.studentId === student.id)
  );
  const studentDocuments = store.getDocuments().filter(d => d.studentId === student.id);

  const handleSign = (dataUrl: string) => {
    if (!signingFor) return;
    store.signAttendance(signingFor.sheetId, signingFor.studentId, signingFor.day, dataUrl);
    setSigningFor(null);
    forceUpdate(n => n + 1);
  };

  const handleCreateProgression = () => {
    if (!selectedFormation) return;
    store.addProgression({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      formation: selectedFormation,
      startDate: student.startDate,
      endDate: student.endDate,
      instructorName: "Stéphane PELARD",
      modules: store.getDefaultModules(selectedFormation),
    });
    setSelectedFormation("");
    setOpenCreateProgression(false);
    forceUpdate(n => n + 1);
  };

  const handleStatusChange = (progressionId: string, moduleId: string, status: ProgressionModule["status"]) => {
    store.updateModuleStatus(progressionId, moduleId, status);
    forceUpdate(n => n + 1);
  };

  const handleRatingChange = (progressionId: string, moduleId: string, type: "start" | "end", value: number) => {
    if (type === "start") store.updateModuleRating(progressionId, moduleId, value, undefined);
    else store.updateModuleRating(progressionId, moduleId, undefined, value);
    forceUpdate(n => n + 1);
  };

  const handleGlobalResult = (progressionId: string, result: "acquis" | "en_cours" | "non_acquis") => {
    store.setGlobalResult(progressionId, result);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/eleves")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">{student.firstName} {student.lastName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusVariants[student.status]}`}>
                {statusLabels[student.status]}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => generateAttestationPDF(student)}>
          <Download className="w-4 h-4 mr-2" /> Attestation
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2"><User className="w-4 h-4" /> Infos</TabsTrigger>
          <TabsTrigger value="emargement" className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Émargement</TabsTrigger>
          <TabsTrigger value="progression" className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Progression</TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Documents</TabsTrigger>
        </TabsList>

        {/* INFO TAB */}
        <TabsContent value="info">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{student.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium">{student.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Formation</p>
                  <p className="text-sm font-medium">{student.formation}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Période</p>
                  <p className="text-sm font-medium">{new Date(student.startDate).toLocaleDateString("fr-FR")} → {new Date(student.endDate).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* EMARGEMENT TAB */}
        <TabsContent value="emargement">
          {attendanceSheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucune feuille d'émargement pour cet élève</p>
              <p className="text-xs mt-1">Créez-en une depuis la page Émargement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceSheets.map(sheet => {
                const studentData = sheet.students.find(s => s.studentId === student.id)!;
                const dayLabels = Array.from({ length: sheet.days }, (_, i) => `J${i + 1}`);
                return (
                  <div key={sheet.id} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-heading font-semibold">{sheet.title}</h3>
                        <p className="text-sm text-muted-foreground">{sheet.formation} — {new Date(sheet.date).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => generateAttendancePDF(sheet)}>
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF
                      </Button>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Grade / Fonction</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Livret</th>
                          {dayLabels.map(d => <th key={d} className="text-center py-2 px-3 text-muted-foreground font-medium">{d}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-3">
                            {sheet.status === "en_cours" ? (
                              <Input className="h-8 text-sm" placeholder="Grade / Fonction" value={studentData.grade}
                                onChange={e => { store.updateStudentGrade(sheet.id, student.id, e.target.value); forceUpdate(n => n + 1); }} />
                            ) : <span>{studentData.grade || "—"}</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {sheet.status === "en_cours" ? (
                              <input type="checkbox" checked={studentData.livretVu} onChange={() => { store.toggleLivretVu(sheet.id, student.id); forceUpdate(n => n + 1); }} className="rounded" />
                            ) : <span>{studentData.livretVu ? "✓" : "—"}</span>}
                          </td>
                          {dayLabels.map(day => {
                            const sig = studentData.signatures[day];
                            return (
                              <td key={day} className="py-3 px-3 text-center">
                                {sig?.signed ? (
                                  <div className="flex flex-col items-center gap-1">
                                    {sig.signatureData ? <img src={sig.signatureData} alt="Signature" className="h-6 border border-border rounded" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
                                    <span className="text-[10px] text-muted-foreground">{sig.signedAt}</span>
                                  </div>
                                ) : sheet.status === "en_cours" ? (
                                  <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                                    onClick={() => setSigningFor({ sheetId: sheet.id, studentId: student.id, day })}>
                                    Signer
                                  </Button>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PROGRESSION TAB */}
        <TabsContent value="progression">
          {progression ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-semibold">{progression.formation}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(progression.startDate).toLocaleDateString("fr-FR")} au {new Date(progression.endDate).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={progression.globalResult || ""} onValueChange={v => handleGlobalResult(progression.id, v as any)}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Résultat global" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acquis">✓ Acquis</SelectItem>
                      <SelectItem value="en_cours">⏳ En cours</SelectItem>
                      <SelectItem value="non_acquis">✗ Non acquis</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => generateProgressionPDF(progression)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              {(() => {
                const acquis = progression.modules.filter(m => m.status === "acquis").length;
                const pct = Math.round((acquis / progression.modules.length) * 100);
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{acquis}/{progression.modules.length} items acquis</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}

              <Tabs defaultValue="evaluation" className="w-full">
                <TabsList className="mb-3">
                  <TabsTrigger value="evaluation">Évaluation des acquis</TabsTrigger>
                  <TabsTrigger value="status">Statut par item</TabsTrigger>
                </TabsList>
                <TabsContent value="evaluation">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Item d'évaluation</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Début (1-5)</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">Fin (1-5)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progression.modules.map(mod => (
                          <tr key={mod.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2.5 px-3 text-sm">{mod.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <RatingStars value={mod.ratingStart} onChange={v => handleRatingChange(progression.id, mod.id, "start", v)} />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <RatingStars value={mod.ratingEnd} onChange={v => handleRatingChange(progression.id, mod.id, "end", v)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                <TabsContent value="status">
                  <div className="space-y-2">
                    {progression.modules.map(mod => {
                      const config = moduleStatusConfig[mod.status];
                      const Icon = config.icon;
                      return (
                        <div key={mod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className={`w-5 h-5 shrink-0 ${config.color}`} />
                            <p className="text-sm font-medium truncate">{mod.name}</p>
                          </div>
                          <Select value={mod.status} onValueChange={v => handleStatusChange(progression.id, mod.id, v as ProgressionModule["status"])}>
                            <SelectTrigger className="w-36 h-8 text-xs shrink-0"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="non_evalue">Non évalué</SelectItem>
                              <SelectItem value="en_cours">En cours</SelectItem>
                              <SelectItem value="acquis">Acquis</SelectItem>
                              <SelectItem value="non_acquis">Non acquis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun livret de progression</p>
              <Button className="mt-3 bg-accent text-accent-foreground hover:opacity-90" onClick={() => setOpenCreateProgression(true)}>
                <Plus className="w-4 h-4 mr-2" /> Créer un livret
              </Button>
            </div>
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents">
          {studentDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun document associé à cet élève</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentDocuments.map(d => (
                <div key={d.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-lg"><FileText className="w-5 h-5 text-muted-foreground" /></div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.size} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[d.category]}`}>
                      {categoryLabels[d.category]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Signature modal */}
      <Dialog open={!!signingFor} onOpenChange={() => setSigningFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Signature {signingFor?.day && `— ${signingFor.day}`}</DialogTitle>
          </DialogHeader>
          <SignatureCanvas onSave={handleSign} onCancel={() => setSigningFor(null)} />
        </DialogContent>
      </Dialog>

      {/* Create progression modal */}
      <Dialog open={openCreateProgression} onOpenChange={setOpenCreateProgression}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Créer un livret de progression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Type de formation</Label>
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger><SelectValue placeholder="Sélectionner la formation" /></SelectTrigger>
                <SelectContent>
                  {FORMATION_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateProgression} className="w-full bg-accent text-accent-foreground hover:opacity-90" disabled={!selectedFormation}>
              Créer le livret
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDetailPage;
