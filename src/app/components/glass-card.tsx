import { motion } from "motion/react";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  spotlight?: boolean;
}

export function GlassCard({ children, className = "", hover = false, spotlight = false }: GlassCardProps) {
  return (
    <motion.div
      className={`backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/20 dark:border-white/10 
        shadow-lg shadow-black/5 rounded-[16px] relative overflow-hidden ${className}`}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.2 }}
    >
      {spotlight && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/10 via-transparent to-[#06b6d4]/10" />
        </div>
      )}
      {children}
    </motion.div>
  );
}
