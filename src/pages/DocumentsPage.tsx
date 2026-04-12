import { useState, useRef } from "react";
import { store, Document } from "@/lib/store";
import { Plus, Trash2, FileText, Search, Filter, Upload, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const categoryLabels: Record<Document["category"], string> = {
  convention: "Convention",
  attestation: "Attestation",
  programme: "Programme",
  facture: "Facture / Devis",
  emargement: "Émargement",
  questionnaire: "Questionnaire",
  veille: "Veille réglementaire",
  plan_action: "Plan d'amélioration",
  prerequis: "Pré-requis",
  autre: "Autre",
};

const categoryColors: Record<Document["category"], string> = {
  convention: "bg-primary/10 text-primary",
  attestation: "bg-success/10 text-success",
  programme: "bg-accent/10 text-accent",
  facture: "bg-warning/10 text-warning",
  emargement: "bg-primary/10 text-primary",
  questionnaire: "bg-accent/10 text-accent",
  veille: "bg-secondary text-secondary-foreground",
  plan_action: "bg-secondary text-secondary-foreground",
  prerequis: "bg-primary/10 text-primary",
  autre: "bg-muted text-muted-foreground",
};

const DocumentsPage = () => {
  const [, forceUpdate] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "convention" as Document["category"] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const docs = store.getDocuments().filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || d.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const handleAdd = () => {
    if (!form.name) return;
    store.addDocument({ ...form, createdAt: new Date().toISOString().split("T")[0], size: "—" });
    setForm({ name: "", category: "convention" });
    setOpen(false);
    forceUpdate(n => n + 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let category: Document["category"] = "autre";
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes("convention")) category = "convention";
      else if (nameLower.includes("convocation")) category = "convention";
      else if (nameLower.includes("attestation")) category = "attestation";
      else if (nameLower.includes("facture") || nameLower.includes("devis")) category = "facture";
      else if (nameLower.includes("emargement") || nameLower.includes("émargement")) category = "emargement";
      else if (nameLower.includes("questionnaire") || nameLower.includes("satisfaction")) category = "questionnaire";
      else if (nameLower.includes("programme")) category = "programme";

      const sizeKo = Math.round(file.size / 1024);
      const sizeStr = sizeKo >= 1024 ? `${(sizeKo / 1024).toFixed(1)} Mo` : `${sizeKo} Ko`;

      // Store file data as base64 for download
      const reader = new FileReader();
      reader.onload = () => {
        store.addDocument({
          name: file.name,
          category,
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
          <h1 className="text-3xl font-heading font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">Gestion de vos documents de formation</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={uploadInputRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleFileUpload} />
          <Button variant="outline" onClick={() => uploadInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Importer
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Nouveau document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Nom du document</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Convention Mars 2025.pdf" /></div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as Document["category"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fichier (optionnel)</Label>
                  <Input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
                </div>
                <Button onClick={() => {
                  if (!form.name) return;
                  const file = fileInputRef.current?.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const sizeKo = Math.round(file.size / 1024);
                      const sizeStr = sizeKo >= 1024 ? `${(sizeKo / 1024).toFixed(1)} Mo` : `${sizeKo} Ko`;
                      store.addDocument({ name: form.name, category: form.category, createdAt: new Date().toISOString().split("T")[0], size: sizeStr, fileData: reader.result as string });
                      setForm({ name: "", category: "convention" });
                      setOpen(false);
                      forceUpdate(n => n + 1);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    handleAdd();
                  }
                }} className="w-full bg-accent text-accent-foreground hover:opacity-90">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un document..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map(d => (
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
            <div className="mt-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[d.category]}`}>
                {categoryLabels[d.category]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {docs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-heading">Aucun document trouvé</p>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
