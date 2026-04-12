import { useState, useRef } from "react";
import { store, Document } from "@/lib/store";
import { Shield, Upload, Download, Trash2, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const VeillePage = () => {
  const [, forceUpdate] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);

  const docs = store.getDocuments().filter(d => d.category === "veille");

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

  const handleDelete = (id: string) => {
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
          <input ref={uploadRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleUpload} />
          <Button onClick={() => uploadRef.current?.click()} className="bg-accent text-accent-foreground hover:opacity-90">
            <Upload className="w-4 h-4 mr-2" /> Importer un document
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="font-heading font-semibold text-lg">Documents réglementaires</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Déposez ici les textes réglementaires, normes, arrêtés et circulaires applicables à votre activité de formation drone.
        </p>

        {docs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucun document de veille réglementaire</p>
            <p className="text-xs mt-1">Importez vos premiers documents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.size} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {d.fileData && (
                    <button onClick={() => handleDownload(d)} className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
