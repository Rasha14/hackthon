import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";
import { useEffect, useState } from "react";

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  suffix?: string;
  delay?: number;
  color?: string;
}

export function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  suffix = "", 
  delay = 0,
  color = "#06b6d4"
}: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <GlassCard hover className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <motion.div
              className="text-5xl font-bold mb-2 bg-gradient-to-br from-[#0066ff] to-[#06b6d4] 
                bg-clip-text text-transparent"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
            >
              {count.toLocaleString()}{suffix}
            </motion.div>
            <div className="text-muted-foreground">{label}</div>
          </div>
          <motion.div
            className="w-16 h-16 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="w-8 h-8" style={{ color }} />
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
