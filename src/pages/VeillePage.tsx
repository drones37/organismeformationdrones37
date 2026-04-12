import { useState, useRef } from "react";
import { store, Document, VeilleEntry } from "@/lib/store";
import { Shield, Upload, Download, Trash2, FileText, Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPES_VEILLE = [
  "Réglementaire",
  "Technologique",
  "Pédagogique",
  "Sécurité",
  "Environnementale",
  "Autre",
];

const VeillePage = () => {
  const [, forceUpdate] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<VeilleEntry>>({});
  const uploadRef = useRef<HTMLInputElement>(null);

  const entries = store.getVeilleEntries();
  const docs = store.getDocuments().filter(d => d.category === "veille");

  const handleAdd = () => {
    store.addVeilleEntry({
      date: new Date().toISOString().split("T")[0],
      type: "Réglementaire",
      contenu: "",
      exploitation: "",
      preuves: "",
    });
    forceUpdate(n => n + 1);
  };

  const startEdit = (entry: VeilleEntry) => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const saveEdit = () => {
    if (editingId && editData) {
      store.updateVeilleEntry(editingId, editData);
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
    store.deleteVeilleEntry(id);
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
          category: "veille" as any,
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Veille réglementaire</h1>
          <p className="text-muted-foreground mt-1">Suivi des évolutions réglementaires et normes applicables</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle entrée
          </Button>
        </div>
      </div>

      {/* Tableau de veille */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="font-heading font-semibold text-lg">Tableau de veille réglementaire</h2>
          <span className="text-xs text-muted-foreground ml-auto">DRONES37 – Responsable : PELARD Stéphane</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold w-[120px]">Date</th>
                <th className="text-left p-3 font-semibold w-[150px]">Type de veille</th>
                <th className="text-left p-3 font-semibold">Contenu</th>
                <th className="text-left p-3 font-semibold">Exploitation</th>
                <th className="text-left p-3 font-semibold w-[180px]">Preuves</th>
                <th className="p-3 w-[100px]"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Aucune entrée de veille</p>
                    <p className="text-xs mt-1">Cliquez sur "Nouvelle entrée" pour commencer</p>
                  </td>
                </tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="border-t border-border hover:bg-muted/30 group">
                  {editingId === entry.id ? (
                    <>
                      <td className="p-2">
                        <Input type="date" value={editData.date || ""} onChange={e => setEditData({ ...editData, date: e.target.value })} className="h-8 text-xs" />
                      </td>
                      <td className="p-2">
                        <Select value={editData.type || ""} onValueChange={v => setEditData({ ...editData, type: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TYPES_VEILLE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input value={editData.contenu || ""} onChange={e => setEditData({ ...editData, contenu: e.target.value })} className="h-8 text-xs" placeholder="Description du contenu..." />
                      </td>
                      <td className="p-2">
                        <Input value={editData.exploitation || ""} onChange={e => setEditData({ ...editData, exploitation: e.target.value })} className="h-8 text-xs" placeholder="Actions d'exploitation..." />
                      </td>
                      <td className="p-2">
                        <Input value={editData.preuves || ""} onChange={e => setEditData({ ...editData, preuves: e.target.value })} className="h-8 text-xs" placeholder="Documents, liens..." />
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
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">{entry.type}</span>
                      </td>
                      <td className="p-3 text-xs">{entry.contenu || <span className="text-muted-foreground italic">À remplir</span>}</td>
                      <td className="p-3 text-xs">{entry.exploitation || <span className="text-muted-foreground italic">À remplir</span>}</td>
                      <td className="p-3 text-xs">{entry.preuves || <span className="text-muted-foreground italic">À remplir</span>}</td>
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

export default VeillePage;
