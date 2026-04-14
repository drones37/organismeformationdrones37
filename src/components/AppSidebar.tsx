import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Shield, ClipboardList, Download, Upload, FileCheck, ClipboardCheck, LogOut } from "lucide-react";
import { useRef } from "react";
import logo from "@/assets/drones37-logo.png";
import { store } from "@/lib/store";
import { toast } from "sonner";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/eleves", icon: Users, label: "Élèves" },
  { to: "/emargement", icon: ClipboardCheck, label: "Émargement" },
  { to: "/facturation", icon: CreditCard, label: "Facturation" },
  { to: "/procedures", icon: FileCheck, label: "Accompagnement PSH" },
  { to: "/veille", icon: Shield, label: "Veille réglementaire" },
  { to: "/plan-action", icon: ClipboardList, label: "Plan d'amélioration" },
];

const AppSidebar = () => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drones37_sauvegarde_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Données exportées avec succès");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = store.importData(ev.target?.result as string);
      if (result) {
        toast.success("Données importées avec succès — rechargement...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Fichier invalide");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border flex items-center gap-3">
        <img src={logo} alt="DRONES37" className="h-10 w-auto" />
        <div>
          <p className="text-xs text-sidebar-foreground mt-0.5 tracking-wide">GESTION DE FORMATION</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer with export/import */}
      <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors" title="Exporter les données">
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors" title="Importer les données">
            <Upload className="w-3.5 h-3.5" /> Importer
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        <p className="text-[10px] text-sidebar-foreground opacity-50 text-center">v1.0 — Centre de formation</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
