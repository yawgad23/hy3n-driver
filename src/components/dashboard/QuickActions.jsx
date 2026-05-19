import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Users, MapPin, Calendar, BarChart3, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    label: "Add Driver",
    icon: Users,
    path: "/drivers",
    color: "bg-primary hover:bg-primary/90",
    delay: 0,
  },
  {
    label: "Log Trip",
    icon: MapPin,
    path: "/trips",
    color: "bg-accent hover:bg-accent/90",
    delay: 0.05,
  },
  {
    label: "Schedule",
    icon: Calendar,
    path: "/schedule",
    color: "bg-chart-2 hover:bg-chart-2/90",
    delay: 0.1,
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    color: "bg-chart-4 hover:bg-chart-4/90",
    delay: 0.15,
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Quick Actions
        </h2>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: action.delay }}
          >
            <Button
              className={`w-full h-auto py-3 px-4 flex flex-col items-center gap-2 ${action.color}`}
              onClick={() => navigate(action.path)}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}