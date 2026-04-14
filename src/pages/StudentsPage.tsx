import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { store, Student } from "@/lib/store";
import { useStoreRefresh } from "@/hooks/useStoreData";
import { Plus, Trash2, Search, User, Download, BookOpen, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateAttestationPDF, generateProgressionPDF } from "@/lib/pdfGenerator";

const statusLabels: Record<Student["status"], string> = {
  en_cours: "En cours",
  terminee: "Terminée",
  a_venir: "À venir",
  abandonnee: "Abandonnée",
};

const statusVariants: Record<Student["status"], string> = {
  en_cours: "bg-accent/15 text-accent border-accent/30",
  terminee: "bg-success/15 text-success border-success/30",
  a_venir: "bg-primary/15 text-primary border-primary/30",
  abandonnee: "bg-destructive/15 text-destructive border-destructive/30",
};

const StudentsPage = () => {
  const navigate = useNavigate();
  useStoreRefresh();
  const [, forceUpdate] = useState(0);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", formation: "", startDate: "", endDate: "", status: "a_venir" as Student["status"] });

  const students = store.getStudents().filter(s =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.formation}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.firstName || !form.lastName) return;
    store.addStudent(form);
    setForm({ firstName: "", lastName: "", email: "", phone: "", formation: "", startDate: "", endDate: "", status: "a_venir" });
    setOpen(false);
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteStudent(id);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Élèves</h1>
          <p className="text-muted-foreground mt-1">{students.length} élève{students.length > 1 ? "s" : ""} enregistré{students.length > 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un élève
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Nouvel élève</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><Label>Prénom</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div><Label>Nom</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Formation</Label><Input value={form.formation} onChange={e => setForm(f => ({ ...f, formation: e.target.value }))} /></div>
              <div><Label>Date de début</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div><Label>Date de fin</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              <div className="col-span-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Student["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_venir">À venir</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="terminee">Terminée</SelectItem>
                    <SelectItem value="abandonnee">Abandonnée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Button onClick={handleAdd} className="w-full bg-accent text-accent-foreground hover:opacity-90">Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Élève</th>
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Formation</th>
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Période</th>
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-center px-6 py-3 font-medium text-muted-foreground">Dossier</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/eleves/${s.id}`)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.dossierComplet ? 'bg-success/15' : 'bg-primary/10'}`}>
                      <User className={`w-4 h-4 ${s.dossierComplet ? 'text-success' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{s.formation}</td>
                <td className="px-6 py-4 text-muted-foreground text-xs">
                  {new Date(s.startDate).toLocaleDateString("fr-FR")} → {new Date(s.endDate).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusVariants[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Checkbox
                      checked={!!s.dossierComplet}
                      onCheckedChange={(checked) => {
                        store.updateStudent(s.id, { dossierComplet: !!checked });
                        forceUpdate(n => n + 1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                    />
                    {s.dossierComplet && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); generateAttestationPDF(s); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                      title="Télécharger l'attestation"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const prog = store.getProgressionByStudent(s.id);
                        if (prog) generateProgressionPDF(prog);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Télécharger le livret de progression"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(s.id, e)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Aucun élève trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
