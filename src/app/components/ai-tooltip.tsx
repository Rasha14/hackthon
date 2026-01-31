import { motion } from "motion/react";
import { GlassCard } from "./glass-card";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface AITooltipProps {
  text: string;
  delay?: number;
}

export function AITooltip({ text, delay = 0 }: AITooltipProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay]);

  if (!displayText && !isTyping) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      <GlassCard className="p-4 border-[#14b8a6]/30 bg-gradient-to-r from-[#14b8a6]/10 to-[#06b6d4]/10">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-[#14b8a6] flex-shrink-0" />
          </motion.div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-[#14b8a6] mb-1">AI Suggestion</div>
            <div className="text-sm">
              {displayText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-1 h-4 bg-[#14b8a6] ml-1"
                />
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
