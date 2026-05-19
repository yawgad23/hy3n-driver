import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, accent = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border transition-shadow hover:shadow-lg",
        accent
          ? "bg-primary text-primary-foreground border-primary/20"
          : "bg-card text-card-foreground border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-xs font-medium uppercase tracking-wider mb-2",
            accent ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-3xl font-heading font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              accent ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center",
          accent ? "bg-primary-foreground/15" : "bg-secondary"
        )}>
          <Icon className={cn("w-5 h-5", accent ? "text-primary-foreground" : "text-primary")} />
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={cn(
        "absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10",
        accent ? "bg-primary-foreground" : "bg-primary"
      )} />
    </motion.div>
  );
}