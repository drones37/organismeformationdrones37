import { useState } from "react";
import { Users, ClipboardCheck, TrendingUp, CalendarDays, Star, MessageSquare, CreditCard, UserX, Award } from "lucide-react";
import { store } from "@/lib/store";
import StatCard from "@/components/StatCard";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const yearNum = Number(year);

  const allStudents = store.getStudents();
  const students = allStudents.filter(s => new Date(s.startDate).getFullYear() === yearNum);
  const sheets = store.getAttendance().filter(a => new Date(a.date).getFullYear() === yearNum);
  const invoices = store.getInvoices();

  const satChaudGlobal = store.getSatisfactionByType("chaud");
  const satFroidGlobal = store.getSatisfactionByType("froid");
  const satChaud = store.getSatisfactionByType("chaud", yearNum);
  const satFroid = store.getSatisfactionByType("froid", yearNum);
  const satCount = store.getSatisfactionCount(yearNum);

  const enCours = students.filter(s => s.status === "en_cours").length;
  const terminees = students.filter(s => s.status === "terminee").length;
  const aVenir = students.filter(s => s.status === "a_venir").length;
  const abandonnes = students.filter(s => s.status === "abandonnee").length;
  const payes = students.filter(s => (invoices[s.id] || "en_attente") === "paye").length;

  // Taux de réussite: terminées / (terminées + abandonnées)
  const totalFinished = terminees + abandonnes;
  const tauxReussite = totalFinished > 0 ? Math.round((terminees / totalFinished) * 100) : 100;
  // Taux d'abandon
  const tauxAbandon = students.length > 0 ? Math.round((abandonnes / students.length) * 100) : 0;

  const years = [...new Set(allStudents.map(s => new Date(s.startDate).getFullYear()))].sort((a, b) => b - a);
  if (!years.includes(2025)) years.push(2025);
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort((a, b) => b - a);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre centre de formation</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Élèves (total)" value={allStudents.length} icon={Users} accent />
        <StatCard title={`Élèves ${year}`} value={students.length} icon={Users} />
        <StatCard title="Satisfaction à chaud" value={`${satChaudGlobal}%`} icon={Star} accent />
        <StatCard title="Satisfaction à froid" value={`${satFroidGlobal}%`} icon={Star} />
        <StatCard title="Taux de réussite" value={`${tauxReussite}%`} icon={Award} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="En cours" value={enCours} icon={TrendingUp} />
        <StatCard title="Émargements" value={sheets.length} icon={ClipboardCheck} />
        <StatCard title="Payés" value={`${payes}/${students.length}`} icon={CreditCard} />
        <StatCard title="Abandons" value={abandonnes} icon={UserX} />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formations en cours */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold">Formations actives</h2>
            <Link to="/eleves" className="text-sm text-accent hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {students.filter(s => s.status === "en_cours").map(s => (
              <Link key={s.id} to={`/eleves/${s.id}`} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                <div>
                  <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-muted-foreground">{s.formation}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(s.endDate).toLocaleDateString("fr-FR")}
                </div>
              </Link>
            ))}
            {enCours === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune formation en cours</p>}
          </div>
        </div>

        {/* Résumé statuts */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-heading font-semibold mb-4">Répartition des formations</h2>
          <div className="space-y-4">
            {[
              { label: "En cours", count: enCours, color: "bg-accent" },
              { label: "Terminées", count: terminees, color: "bg-success" },
              { label: "À venir", count: aVenir, color: "bg-primary" },
              { label: "Abandonnées", count: abandonnes, color: "bg-destructive" },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${students.length ? (item.count / students.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Satisfaction card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-heading font-semibold">Satisfaction {year}</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">🔥 À chaud</span>
              <span className={`text-sm font-bold ${satChaud >= 80 ? "text-success" : satChaud >= 60 ? "text-warning" : "text-destructive"}`}>{satChaud}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">❄️ À froid</span>
              <span className={`text-sm font-bold ${satFroid >= 80 ? "text-success" : satFroid >= 60 ? "text-warning" : "text-destructive"}`}>{satFroid}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">📊 Taux d'abandon</span>
              <span className={`text-sm font-bold ${tauxAbandon <= 10 ? "text-success" : tauxAbandon <= 25 ? "text-warning" : "text-destructive"}`}>{tauxAbandon}%</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Basé sur {satCount} questionnaire(s) — {students.length} élève(s) en {year}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
