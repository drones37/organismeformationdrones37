import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}

const StatCard = ({ title, value, icon: Icon, accent }: StatCardProps) => (
  <div className={`rounded-xl p-6 animate-fade-in ${accent ? "bg-accent text-accent-foreground" : "bg-card text-card-foreground"} border border-border shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${accent ? "text-accent-foreground/70" : "text-muted-foreground"}`}>{title}</p>
        <p className="text-3xl font-heading font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${accent ? "bg-accent-foreground/10" : "bg-muted"}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export default StatCard;
