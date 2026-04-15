import { useState, useRef } from "react";
import { store, Document } from "@/lib/store";
import { FileText, Upload, Download, Trash2, Plus, MessageSquareWarning, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateReclamationPdf } from "@/lib/pdfGenerator";

const reclamationSteps = [
  "Réception et enregistrement de la réclamation (fiche dédiée)",
  "Analyse et qualification de la réclamation sous 48h",
  "Mise en place d'actions correctives avec le responsable concerné",
  "Suivi, retour au réclamant et clôture de la réclamation",
];

const ReclamationsPage = () => {
  const [, forceUpdate] = useState(0);
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Filter documents with a "reclamation" category, or fallback to procedure-tagged ones
  const reclamationDocs = store.getDocuments().filter(d => d.category === "procedure" && d.name.toLowerCase().includes("réclamation"));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const sizeKo = Math.round(file.size / 1024);
      const sizeStr = sizeKo >= 1024 ? `${(sizeKo / 1024).toFixed(1)} Mo` : `${sizeKo} Ko`;
      store.addDocument({
        name: uploadName || file.name,
        category: "procedure",
        createdAt: new Date().toISOString().split("T")[0],
        size: sizeStr,
        fileData: reader.result as string,
      });
      setUploadName("");
      setOpenUpload(false);
      forceUpdate(n => n + 1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const sizeKo = Math.round(file.size / 1024);
        const sizeStr = sizeKo >= 1024 ? `${(sizeKo / 1024).toFixed(1)} Mo` : `${sizeKo} Ko`;
        store.addDocument({
          name: file.name,
          category: "procedure",
          createdAt: new Date().toISOString().split("T")[0],
          size: sizeStr,
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

  const handleDelete = (id: string) => {
    store.deleteDocument(id);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Réclamations</h1>
          <p className="text-muted-foreground mt-1">Procédure de traitement des réclamations — Qualiopi indicateur 31</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => generateReclamationPdf()}>
            <FileDown className="w-4 h-4 mr-2" /> Fiche de réclamation
          </Button>
          <input ref={uploadInputRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleQuickUpload} />
          <Button variant="outline" onClick={() => uploadInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Importer
          </Button>
          <Dialog open={openUpload} onOpenChange={setOpenUpload}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Ajouter un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nom du document</Label>
                  <Input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Ex: Réclamation traitée — Mars 2025" />
                </div>
                <div>
                  <Label>Fichier</Label>
                  <Input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleFileUpload} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Procédure */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-warning/10 rounded-lg shrink-0">
            <MessageSquareWarning className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-heading font-semibold">Procédure de traitement des réclamations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Réception, analyse et suivi des réclamations stagiaires et parties prenantes</p>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Étapes du traitement</p>
              <ol className="space-y-1.5">
                {reclamationSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="bg-warning/15 text-warning text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">💡 Utilisation :</span> Téléchargez la fiche de réclamation ci-dessus, faites-la compléter par le stagiaire, puis analysez et traitez la demande. Le document inclut les sections d'identification, description, et traitement avec signatures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents uploadés */}
      {reclamationDocs.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">Documents importés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reclamationDocs.map(d => (
              <div key={d.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 bg-muted rounded-lg shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.size} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {d.fileData && (
                      <button onClick={() => handleDownload(d)} className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReclamationsPage;
