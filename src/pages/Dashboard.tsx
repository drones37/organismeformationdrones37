import { Users, ClipboardCheck, FolderOpen, TrendingUp, CalendarDays, Star, MessageSquare } from "lucide-react";
import { store } from "@/lib/store";
import StatCard from "@/components/StatCard";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const students = store.getStudents();
  const sheets = store.getAttendance();
  const docs = store.getDocuments();
  const globalSat = store.getGlobalSatisfaction();
  const satChaud = store.getSatisfactionByType("chaud");
  const satFroid = store.getSatisfactionByType("froid");

  const enCours = students.filter(s => s.status === "en_cours").length;
  const terminees = students.filter(s => s.status === "terminee").length;
  const aVenir = students.filter(s => s.status === "a_venir").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de votre centre de formation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total élèves" value={students.length} icon={Users} accent />
        <StatCard title="Formations en cours" value={enCours} icon={TrendingUp} />
        <StatCard title="Feuilles d'émargement" value={sheets.length} icon={ClipboardCheck} />
        <StatCard title="Documents" value={docs.length} icon={FolderOpen} />
        <StatCard title="Satisfaction globale" value={`${globalSat}%`} icon={Star} accent />
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

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-3">Derniers documents</h3>
            {docs.slice(0, 3).map(d => (
              <div key={d.id} className="flex items-center justify-between py-2">
                <p className="text-sm truncate max-w-[200px]">{d.name}</p>
                <span className="text-xs text-muted-foreground">{d.size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Satisfaction card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-heading font-semibold">Satisfaction</h2>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--accent))" strokeWidth="8"
                  strokeDasharray={`${globalSat * 2.64} ${264 - globalSat * 2.64}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading font-bold">{globalSat}%</span>
                <span className="text-xs text-muted-foreground">globale</span>
              </div>
            </div>
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
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Basé sur {store.getSatisfactions().length} questionnaire(s)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
