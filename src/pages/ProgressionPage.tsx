import { useState } from "react";
import { store, ProgressionModule } from "@/lib/store";
import { FORMATION_TYPES, type FormationType } from "@/lib/formationModules";
import { BookOpen, CheckCircle2, Clock, XCircle, AlertCircle, Download, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateProgressionPDF } from "@/lib/pdfGenerator";

const statusConfig: Record<ProgressionModule["status"], { label: string; icon: typeof CheckCircle2; color: string }> = {
  acquis: { label: "Acquis", icon: CheckCircle2, color: "text-success" },
  en_cours: { label: "En cours", icon: Clock, color: "text-warning" },
  non_acquis: { label: "Non acquis", icon: XCircle, color: "text-destructive" },
  non_evalue: { label: "Non évalué", icon: AlertCircle, color: "text-muted-foreground" },
};

const RatingStars = ({ value, onChange }: { value?: number; onChange: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        onClick={() => onChange(n)}
        className="p-0.5 hover:scale-110 transition-transform"
      >
        <Star
          className={`w-4 h-4 ${n <= (value || 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      </button>
    ))}
  </div>
);

const ProgressionPage = () => {
  const [, forceUpdate] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedFormation, setSelectedFormation] = useState<string>("");

  const progressions = store.getProgressions();
  const allStudents = store.getStudents();

  const handleCreate = () => {
    const student = allStudents.find(s => s.id === selectedStudent);
    if (!student || !selectedFormation) return;
    store.addProgression({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      formation: selectedFormation,
      startDate: student.startDate,
      endDate: student.endDate,
      instructorName: "Stéphane PELARD",
      modules: store.getDefaultModules(selectedFormation),
    });
    setSelectedStudent("");
    setSelectedFormation("");
    setOpenCreate(false);
    forceUpdate(n => n + 1);
  };

  const handleStatusChange = (progressionId: string, moduleId: string, status: ProgressionModule["status"]) => {
    store.updateModuleStatus(progressionId, moduleId, status);
    forceUpdate(n => n + 1);
  };

  const handleRatingChange = (progressionId: string, moduleId: string, type: "start" | "end", value: number) => {
    if (type === "start") {
      store.updateModuleRating(progressionId, moduleId, value, undefined);
    } else {
      store.updateModuleRating(progressionId, moduleId, undefined, value);
    }
    forceUpdate(n => n + 1);
  };

  const handleGlobalResult = (progressionId: string, result: "acquis" | "en_cours" | "non_acquis") => {
    store.setGlobalResult(progressionId, result);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Livrets de progression</h1>
          <p className="text-muted-foreground mt-1">Suivi des compétences par stagiaire</p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Nouveau livret
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Créer un livret de progression</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Élève</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un élève" /></SelectTrigger>
                  <SelectContent>
                    {allStudents.filter(s => !store.getProgressionByStudent(s.id)).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type de formation</Label>
                <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner la formation" /></SelectTrigger>
                  <SelectContent>
                    {FORMATION_TYPES.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full bg-accent text-accent-foreground hover:opacity-90" disabled={!selectedStudent || !selectedFormation}>
                Créer le livret
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {progressions.map(prog => {
          const acquis = prog.modules.filter(m => m.status === "acquis").length;
          const pct = Math.round((acquis / prog.modules.length) * 100);

          return (
            <div key={prog.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold">{prog.studentName}</h2>
                    <p className="text-sm text-muted-foreground">{prog.formation}</p>
                    <p className="text-xs text-muted-foreground">{new Date(prog.startDate).toLocaleDateString("fr-FR")} au {new Date(prog.endDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={prog.globalResult || ""}
                    onValueChange={v => handleGlobalResult(prog.id, v as any)}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Résultat global" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acquis">✓ Acquis</SelectItem>
                      <SelectItem value="en_cours">⏳ En cours</SelectItem>
                      <SelectItem value="non_acquis">✗ Non acquis</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => generateProgressionPDF(prog)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{acquis}/{prog.modules.length} items acquis</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

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
                        {prog.modules.map(mod => (
                          <tr key={mod.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2.5 px-3 text-sm">{mod.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <RatingStars
                                value={mod.ratingStart}
                                onChange={v => handleRatingChange(prog.id, mod.id, "start", v)}
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <RatingStars
                                value={mod.ratingEnd}
                                onChange={v => handleRatingChange(prog.id, mod.id, "end", v)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="status">
                  <div className="space-y-2">
                    {prog.modules.map(mod => {
                      const config = statusConfig[mod.status];
                      const Icon = config.icon;
                      return (
                        <div key={mod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className={`w-5 h-5 shrink-0 ${config.color}`} />
                            <p className="text-sm font-medium truncate">{mod.name}</p>
                          </div>
                          <Select
                            value={mod.status}
                            onValueChange={v => handleStatusChange(prog.id, mod.id, v as ProgressionModule["status"])}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs shrink-0">
                              <SelectValue />
                            </SelectTrigger>
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
          );
        })}

        {progressions.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-heading">Aucun livret de progression</p>
            <p className="text-sm mt-1">Créez un livret pour commencer le suivi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressionPage;
