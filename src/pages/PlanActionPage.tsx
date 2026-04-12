import { useState, useRef } from "react";
import { store, Document, PlanActionEntry } from "@/lib/store";
import { ClipboardList, Upload, Download, Trash2, FileText, Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ORIGINES = [
  { value: "satisfaction_chaud", label: "Satisfaction à chaud" },
  { value: "satisfaction_froid", label: "Satisfaction à froid" },
  { value: "reclamation", label: "Réclamation élève" },
  { value: "audit", label: "Audit interne" },
  { value: "autre", label: "Autre" },
];

const STATUTS = [
  { value: "a_faire", label: "À faire", className: "bg-destructive/20 text-destructive" },
  { value: "en_cours", label: "En cours", className: "bg-amber-100 text-amber-800" },
  { value: "fait", label: "Fait", className: "bg-green-100 text-green-800" },
];

const PlanActionPage = () => {
  const [, forceUpdate] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlanActionEntry>>({});
  const uploadRef = useRef<HTMLInputElement>(null);

  const entries = store.getPlanActionEntries();
  const docs = store.getDocuments().filter(d => d.category === "plan_action");

  // Stats satisfaction pour contexte
  const satChaud = store.getSatisfactionByType("chaud");
  const satFroid = store.getSatisfactionByType("froid");

  const handleAdd = () => {
    store.addPlanActionEntry({
      date: new Date().toISOString().split("T")[0],
      origine: "satisfaction_chaud",
      constat: "",
      action: "",
      responsable: "Stéphane PELARD",
      echeance: "",
      statut: "a_faire",
      commentaire: "",
    });
    forceUpdate(n => n + 1);
  };

  const startEdit = (entry: PlanActionEntry) => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const saveEdit = () => {
    if (editingId && editData) {
      store.updatePlanActionEntry(editingId, editData);
      setEditingId(null);
      setEditData({});
      forceUpdate(n => n + 1);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id: string) => {
    store.deletePlanActionEntry(id);
    forceUpdate(n => n + 1);
  };

  const quickStatusChange = (id: string, statut: string) => {
    store.updatePlanActionEntry(id, { statut: statut as PlanActionEntry["statut"] });
    forceUpdate(n => n + 1);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const sizeKo = Math.round(file.size / 1024);
        store.addDocument({
          name: file.name,
          category: "plan_action" as any,
          createdAt: new Date().toISOString().split("T")[0],
          size: sizeKo >= 1024 ? `${(sizeKo / 1024).toFixed(1)} Mo` : `${sizeKo} Ko`,
          fileData: reader.result as string,
        });
        forceUpdate(n => n + 1);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDownload = (doc: Document) => {
    if (doc.fileData) {
      const link = document.createElement("a");
      link.href = doc.fileData;
      link.download = doc.name;
      link.click();
    }
  };

  const handleDeleteDoc = (id: string) => {
    store.deleteDocument(id);
    forceUpdate(n => n + 1);
  };

  const getOrigineLabel = (val: string) => ORIGINES.find(o => o.value === val)?.label || val;
  const getStatutInfo = (val: string) => STATUTS.find(s => s.value === val) || STATUTS[0];

  const countByStatut = (s: string) => entries.filter(e => e.statut === s).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Plan d'amélioration continue</h1>
          <p className="text-muted-foreground mt-1">Actions correctives issues de l'analyse des satisfactions et réclamations</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle action
        </Button>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{satChaud}%</p>
          <p className="text-xs text-muted-foreground">Satisfaction à chaud</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{satFroid}%</p>
          <p className="text-xs text-muted-foreground">Satisfaction à froid</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{countByStatut("a_faire")}</p>
          <p className="text-xs text-muted-foreground">À faire</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{countByStatut("en_cours")}</p>
          <p className="text-xs text-muted-foreground">En cours</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{countByStatut("fait")}</p>
          <p className="text-xs text-muted-foreground">Réalisées</p>
        </div>
      </div>

      {/* Tableau plan d'action */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <ClipboardList className="w-5 h-5 text-accent" />
          <h2 className="font-heading font-semibold text-lg">Plan d'actions correctives</h2>
          <span className="text-xs text-muted-foreground ml-auto">DRONES37 – Responsable : PELARD Stéphane</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold w-[100px]">Date</th>
                <th className="text-left p-3 font-semibold w-[140px]">Origine</th>
                <th className="text-left p-3 font-semibold">Constat / Problème</th>
                <th className="text-left p-3 font-semibold">Action corrective</th>
                <th className="text-left p-3 font-semibold w-[130px]">Responsable</th>
                <th className="text-left p-3 font-semibold w-[100px]">Échéance</th>
                <th className="text-left p-3 font-semibold w-[100px]">Statut</th>
                <th className="p-3 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Aucune action corrective</p>
                    <p className="text-xs mt-1">Cliquez sur "Nouvelle action" pour commencer</p>
                  </td>
                </tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="border-t border-border hover:bg-muted/30 group">
                  {editingId === entry.id ? (
                    <>
                      <td className="p-2"><Input type="date" value={editData.date || ""} onChange={e => setEditData({ ...editData, date: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="p-2">
                        <Select value={editData.origine || ""} onValueChange={v => setEditData({ ...editData, origine: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ORIGINES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2"><Input value={editData.constat || ""} onChange={e => setEditData({ ...editData, constat: e.target.value })} className="h-8 text-xs" placeholder="Constat..." /></td>
                      <td className="p-2"><Input value={editData.action || ""} onChange={e => setEditData({ ...editData, action: e.target.value })} className="h-8 text-xs" placeholder="Action corrective..." /></td>
                      <td className="p-2"><Input value={editData.responsable || ""} onChange={e => setEditData({ ...editData, responsable: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="p-2"><Input type="date" value={editData.echeance || ""} onChange={e => setEditData({ ...editData, echeance: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="p-2">
                        <Select value={editData.statut || ""} onValueChange={v => setEditData({ ...editData, statut: v as any })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="p-1.5 rounded text-green-600 hover:bg-green-50"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 rounded text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-xs">{entry.date ? new Date(entry.date).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">{getOrigineLabel(entry.origine)}</span></td>
                      <td className="p-3 text-xs">{entry.constat || <span className="text-muted-foreground italic">À remplir</span>}</td>
                      <td className="p-3 text-xs">{entry.action || <span className="text-muted-foreground italic">À remplir</span>}</td>
                      <td className="p-3 text-xs">{entry.responsable}</td>
                      <td className="p-3 text-xs">{entry.echeance ? new Date(entry.echeance).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="p-3">
                        <Select value={entry.statut} onValueChange={v => quickStatusChange(entry.id, v)}>
                          <SelectTrigger className={`h-7 text-xs border-0 ${getStatutInfo(entry.statut).className}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(entry)} className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-accent/10"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents joints */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-semibold text-lg">Documents joints</h2>
          </div>
          <div>
            <input ref={uploadRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleUpload} />
            <Button variant="outline" size="sm" onClick={() => uploadRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Importer
            </Button>
          </div>
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun document joint</p>
        ) : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.size} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {d.fileData && (
                    <button onClick={() => handleDownload(d)} className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"><Download className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => handleDeleteDoc(d.id)} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanActionPage;
