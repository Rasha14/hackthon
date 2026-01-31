import { motion } from "motion/react";
import { Check } from "lucide-react";

interface TimelineStep {
  label: string;
  date: string;
  completed: boolean;
  active: boolean;
}

interface RecoveryTimelineProps {
  steps: TimelineStep[];
}

export function RecoveryTimeline({ steps }: RecoveryTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          className="flex gap-6 mb-8 last:mb-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <motion.div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 relative z-10
                ${step.completed || step.active
                  ? 'bg-gradient-to-r from-[#0066ff] to-[#06b6d4] border-transparent' 
                  : 'bg-white/50 dark:bg-white/5 border-white/20'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2 + 0.2, type: "spring" }}
            >
              {step.completed ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <span className={`w-3 h-3 rounded-full ${
                  step.active ? 'bg-white animate-pulse' : 'bg-white/40'
                }`} />
              )}
            </motion.div>
            
            {index < steps.length - 1 && (
              <div className="w-0.5 h-16 bg-white/20 dark:bg-white/10 relative">
                {step.completed && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-[#0066ff] to-[#06b6d4]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.4 }}
                    style={{ transformOrigin: "top" }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Timeline content */}
          <motion.div
            className="flex-1 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.2 + 0.3 }}
          >
            <div className="font-semibold mb-1">{step.label}</div>
            <div className="text-sm text-muted-foreground">{step.date}</div>
            {step.active && (
              <motion.div
                className="mt-3 px-4 py-2 bg-gradient-to-r from-[#14b8a6]/20 to-[#06b6d4]/20 
                  rounded-[8px] inline-block text-sm font-semibold text-[#14b8a6]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 + 0.5 }}
              >
                In Progress
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
