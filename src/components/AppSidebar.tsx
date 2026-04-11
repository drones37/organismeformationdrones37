import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ClipboardCheck, FolderOpen, BookOpen } from "lucide-react";
import logo from "@/assets/drones37-logo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/eleves", icon: Users, label: "Élèves" },
  { to: "/emargement", icon: ClipboardCheck, label: "Émargement" },
  { to: "/progression", icon: BookOpen, label: "Progression" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
];

const AppSidebar = () => {
  const location = useLocation();

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

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground opacity-60">v1.0 — Centre de formation</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
