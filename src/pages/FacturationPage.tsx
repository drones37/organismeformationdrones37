import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { CreditCard, Check, Clock, AlertTriangle, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const statusConfig = {
  paye: { label: "Payé", icon: Check, color: "bg-success/15 text-success border-success/30" },
  en_attente: { label: "En attente", icon: Clock, color: "bg-warning/15 text-warning border-warning/30" },
  impaye: { label: "Impayé", icon: AlertTriangle, color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const FacturationPage = () => {
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const students = store.getStudents();
  const invoices = store.getInvoices();

  const years = [...new Set(students.map(s => new Date(s.startDate).getFullYear()))].sort((a, b) => b - a);
  if (!years.includes(Number(yearFilter))) years.push(Number(yearFilter));
  years.sort((a, b) => b - a);

  const filteredStudents = students.filter(s => new Date(s.startDate).getFullYear().toString() === yearFilter);

  const handleStatusChange = (studentId: string, status: "paye" | "en_attente" | "impaye") => {
    store.updateInvoiceStatus(studentId, status);
    forceUpdate(n => n + 1);
  };

  const handleFileUpload = (studentId: string, type: "facture" | "devis", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    store.addDocument({
      name: `${type === "facture" ? "Facture" : "Devis"} - ${students.find(s => s.id === studentId)?.lastName || ""}.pdf`,
      category: "facture",
      studentId,
      createdAt: new Date().toISOString().split("T")[0],
      size: `${Math.round(file.size / 1024)} Ko`,
    });
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Facturation</h1>
          <p className="text-muted-foreground mt-1">Suivi des paiements et documents comptables</p>
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["paye", "en_attente", "impaye"] as const).map(status => {
          const config = statusConfig[status];
          const count = filteredStudents.filter(s => (invoices[s.id] || "en_attente") === status).length;
          const Icon = config.icon;
          return (
            <div key={status} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${config.color}`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-2xl font-heading font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Élève</th>
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Formation</th>
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Statut paiement</th>
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">Documents</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => {
              const status = (invoices[s.id] || "en_attente") as keyof typeof statusConfig;
              const config = statusConfig[status];
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => navigate(`/eleves/${s.id}`)} className="flex items-center gap-3 hover:text-accent transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{s.formation}</td>
                  <td className="px-6 py-4">
                    <Select value={status} onValueChange={v => handleStatusChange(s.id, v as any)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paye">✓ Payé</SelectItem>
                        <SelectItem value="en_attente">⏳ En attente</SelectItem>
                        <SelectItem value="impaye">⚠ Impayé</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileUpload(s.id, "facture", e)} />
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted hover:bg-muted/70 transition-colors">
                          <Upload className="w-3 h-3" /> Facture
                        </span>
                      </label>
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileUpload(s.id, "devis", e)} />
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted hover:bg-muted/70 transition-colors">
                          <Upload className="w-3 h-3" /> Devis
                        </span>
                      </label>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Aucun élève pour cette année</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacturationPage;
