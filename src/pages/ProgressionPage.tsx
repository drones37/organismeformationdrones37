import { useState } from "react";
import { store, ProgressionModule } from "@/lib/store";
import { BookOpen, CheckCircle2, Clock, XCircle, AlertCircle, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateProgressionPDF } from "@/lib/pdfGenerator";

const statusConfig: Record<ProgressionModule["status"], { label: string; icon: typeof CheckCircle2; color: string }> = {
  acquis: { label: "Acquis", icon: CheckCircle2, color: "text-success" },
  en_cours: { label: "En cours", icon: Clock, color: "text-warning" },
  non_acquis: { label: "Non acquis", icon: XCircle, color: "text-destructive" },
  non_evalue: { label: "Non évalué", icon: AlertCircle, color: "text-muted-foreground" },
};

const ProgressionPage = () => {
  const [, forceUpdate] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");

  const progressions = store.getProgressions();
  const allStudents = store.getStudents();

  const handleCreate = () => {
    const student = allStudents.find(s => s.id === selectedStudent);
    if (!student) return;
    store.addProgression({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      formation: student.formation,
      startDate: student.startDate,
      endDate: student.endDate,
      instructorName: "Stéphane PELARD",
      modules: store.getDefaultModules(),
    });
    setSelectedStudent("");
    setOpenCreate(false);
    forceUpdate(n => n + 1);
  };

  const handleStatusChange = (progressionId: string, moduleId: string, status: ProgressionModule["status"]) => {
    store.updateModuleStatus(progressionId, moduleId, status);
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
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.formation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full bg-accent text-accent-foreground hover:opacity-90" disabled={!selectedStudent}>
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
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-semibold">{prog.studentName}</h2>
                      <p className="text-sm text-muted-foreground">{prog.formation} — {new Date(prog.startDate).toLocaleDateString("fr-FR")} au {new Date(prog.endDate).toLocaleDateString("fr-FR")}</p>
                    </div>
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
                  <span>{acquis}/{prog.modules.length} modules acquis</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-2">
                {prog.modules.map(mod => {
                  const config = statusConfig[mod.status];
                  const Icon = config.icon;
                  return (
                    <div key={mod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{mod.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{mod.objectives.join(" • ")}</p>
                        </div>
                      </div>
                      <Select
                        value={mod.status}
                        onValueChange={v => handleStatusChange(prog.id, mod.id, v as ProgressionModule["status"])}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
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
