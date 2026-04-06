import { useState } from "react";
import { store } from "@/lib/store";
import { Plus, ClipboardCheck, CheckCircle2, Clock, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "@/components/SignatureCanvas";

const AttendancePage = () => {
  const [, forceUpdate] = useState(0);
  const [open, setOpen] = useState(false);
  const [signingFor, setSigningFor] = useState<{ sheetId: string; studentId: string } | null>(null);
  const [form, setForm] = useState({ title: "", date: "", formation: "" });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const sheets = store.getAttendance();
  const allStudents = store.getStudents();

  const handleCreate = () => {
    if (!form.title || !form.date) return;
    store.addAttendance({
      ...form,
      status: "en_cours",
      students: selectedStudents.map(id => {
        const s = allStudents.find(st => st.id === id)!;
        return { studentId: id, studentName: `${s.firstName} ${s.lastName}`, signed: false };
      }),
    });
    setForm({ title: "", date: "", formation: "" });
    setSelectedStudents([]);
    setOpen(false);
    forceUpdate(n => n + 1);
  };

  const handleSign = (dataUrl: string) => {
    if (!signingFor) return;
    store.signAttendance(signingFor.sheetId, signingFor.studentId, dataUrl);
    setSigningFor(null);
    forceUpdate(n => n + 1);
  };

  const handleClose = (id: string) => {
    store.closeAttendance(id);
    forceUpdate(n => n + 1);
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
              <div><Label>Titre</Label><Input placeholder="Ex: Émargement Jour 1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label>Formation</Label><Input placeholder="Ex: Scénarios S1/S2/S3" value={form.formation} onChange={e => setForm(f => ({ ...f, formation: e.target.value }))} /></div>
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
        {sheets.map(sheet => (
          <div key={sheet.id} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-heading font-semibold">{sheet.title}</h2>
                  <span className={`flex items-center gap-1 text-xs font-medium ${statusColors[sheet.status]}`}>
                    {statusIcons[sheet.status]} {statusLabels[sheet.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{sheet.formation} — {new Date(sheet.date).toLocaleDateString("fr-FR")}</p>
              </div>
              {sheet.status === "en_cours" && (
                <Button variant="outline" size="sm" onClick={() => handleClose(sheet.id)}>
                  <Lock className="w-3.5 h-3.5 mr-1" /> Clôturer
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {sheet.students.map(s => (
                <div key={s.studentId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {s.signed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{s.studentName}</p>
                      {s.signedAt && <p className="text-xs text-muted-foreground">Signé le {s.signedAt}</p>}
                    </div>
                  </div>
                  {!s.signed && sheet.status === "en_cours" && (
                    <Button size="sm" variant="outline" onClick={() => setSigningFor({ sheetId: sheet.id, studentId: s.studentId })}>
                      Signer
                    </Button>
                  )}
                  {s.signed && s.signatureData && (
                    <img src={s.signatureData} alt="Signature" className="h-8 border border-border rounded" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              {sheet.students.filter(s => s.signed).length}/{sheet.students.length} signature{sheet.students.length > 1 ? "s" : ""}
            </div>
          </div>
        ))}

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
            <DialogTitle className="font-heading text-xl">Signature</DialogTitle>
          </DialogHeader>
          <SignatureCanvas onSave={handleSign} onCancel={() => setSigningFor(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendancePage;
