import { useState, useRef } from "react";
import { store, Document } from "@/lib/store";
import { FileText, Upload, Download, Trash2, Plus, Phone, User, Shield, BookOpen, FileDown, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generatePshOrientationPdf, generateReclamationPdf } from "@/lib/pdfGenerator";
import { Label } from "@/components/ui/label";

// Procédure PSH uniquement
const pshProcedure = {
  title: "Procédure Handicap (PSH)",
  description: "Accueil et accompagnement des personnes en situation de handicap",
  icon: Shield,
  referent: "PELARD Stéphane — 06 51 11 27 02",
  content: [
    "Garantir l'accueil et l'adaptation des formations pour les PSH",
    "Identification du besoin lors de l'inscription ou sur demande",
    "Supports adaptés, rythme personnalisé, accompagnement individualisé",
    "Suivi individualisé et ajustement des adaptations",
  ],
  partners: [
    "AGEFIPH Centre-Val de Loire – Aides financières et techniques",
    "Cap Emploi 37 – Accompagnement vers l'emploi",
    "MDPH Indre-et-Loire – Orientation et reconnaissance handicap",
    "Ressource Handicap Formation (RHF) – Appui aux organismes de formation",
    "Pôle emploi – Référent handicap",
    "APF France Handicap – Accompagnement des personnes",
  ],
};

// Procédure Réclamations
const reclamationProcedure = {
  title: "Procédure de traitement des réclamations",
  description: "Réception, analyse et suivi des réclamations stagiaires et parties prenantes",
  icon: MessageSquareWarning,
  content: [
    "Réception et enregistrement de la réclamation (fiche dédiée)",
    "Analyse et qualification de la réclamation sous 48h",
    "Mise en place d'actions correctives avec le responsable concerné",
    "Suivi, retour au réclamant et clôture de la réclamation",
  ],
};

const ProceduresPage = () => {
  const [, forceUpdate] = useState(0);
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const procedureDocs = store.getDocuments().filter(d => d.category === "procedure");

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

  const PshIcon = pshProcedure.icon;
  const ReclamIcon = reclamationProcedure.icon;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ===== SECTION PSH ===== */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Accompagnement PSH</h1>
            <p className="text-muted-foreground mt-1">Accueil et orientation des personnes en situation de handicap — Certification Qualiopi n°211201_74</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => generatePshOrientationPdf()}>
              <FileDown className="w-4 h-4 mr-2" /> Fiche orientation PSH
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
                    <Input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Ex: Attestation d'adaptation PSH" />
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

        <div className="mt-4 bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-lg shrink-0">
              <PshIcon className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-heading font-semibold">{pshProcedure.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{pshProcedure.description}</p>

              <div className="flex items-center gap-2 mt-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Référent :</span>
                <span>{pshProcedure.referent}</span>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Étapes clés</p>
                <ol className="space-y-1.5">
                  {pshProcedure.content.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="bg-accent/15 text-accent text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Annuaire partenaires — Indre-et-Loire</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {pshProcedure.partners.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION RÉCLAMATIONS ===== */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold">Réclamations</h2>
            <p className="text-muted-foreground mt-1">Procédure de traitement des réclamations — Qualiopi indicateur 31</p>
          </div>
          <Button variant="outline" onClick={() => generateReclamationPdf()}>
            <FileDown className="w-4 h-4 mr-2" /> Fiche de réclamation
          </Button>
        </div>

        <div className="mt-4 bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-warning/10 rounded-lg shrink-0">
              <ReclamIcon className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-heading font-semibold">{reclamationProcedure.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{reclamationProcedure.description}</p>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Étapes du traitement</p>
                <ol className="space-y-1.5">
                  {reclamationProcedure.content.map((step, i) => (
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
      </div>

      {/* Documents uploadés */}
      {procedureDocs.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">Documents importés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {procedureDocs.map(d => (
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

export default ProceduresPage;
