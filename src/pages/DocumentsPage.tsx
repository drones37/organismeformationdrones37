import { useState } from "react";
import { store, Document } from "@/lib/store";
import { Plus, Trash2, FileText, Search, Filter } from "lucide-react";
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

const DocumentsPage = () => {
  const [, forceUpdate] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "convention" as Document["category"], size: "0 Ko" });

  const docs = store.getDocuments().filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || d.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const handleAdd = () => {
    if (!form.name) return;
    store.addDocument({ ...form, createdAt: new Date().toISOString().split("T")[0] });
    setForm({ name: "", category: "convention", size: "0 Ko" });
    setOpen(false);
    forceUpdate(n => n + 1);
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
              <Button onClick={handleAdd} className="w-full bg-accent text-accent-foreground hover:opacity-90">Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
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
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-muted rounded-lg">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.size} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
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
