import { motion } from "motion/react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center relative">
            <motion.div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 relative z-10
                ${index <= currentStep 
                  ? 'bg-gradient-to-r from-[#0066ff] to-[#06b6d4] border-transparent text-white' 
                  : 'bg-white/50 dark:bg-white/5 border-white/20 text-muted-foreground'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {index < currentStep ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Check className="w-6 h-6" />
                </motion.div>
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </motion.div>
            <motion.div
              className="text-sm mt-2 text-center whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              {step}
            </motion.div>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-white/20 dark:bg-white/10 mx-4 relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#0066ff] to-[#06b6d4]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: index < currentStep ? 1 : 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
