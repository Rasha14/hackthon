import { motion } from "motion/react";
import { GlassCard } from "./glass-card";
import { MapPin, Eye, TrendingUp } from "lucide-react";

interface MatchCardProps {
  id: string;
  title: string;
  image: string;
  matchScore: number;
  location: string;
  date: string;
  textSimilarity: number;
  imageSimilarity: number;
  locationRelevance: number;
  delay?: number;
}

export function MatchCard({
  title,
  image,
  matchScore,
  location,
  date,
  textSimilarity,
  imageSimilarity,
  locationRelevance,
  delay = 0,
}: MatchCardProps) {
  const getConfidence = (score: number) => {
    if (score >= 80) return { label: "High", color: "#14b8a6" };
    if (score >= 50) return { label: "Medium", color: "#06b6d4" };
    return { label: "Low", color: "#64748b" };
  };

  const confidence = getConfidence(matchScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <GlassCard hover spotlight className="overflow-hidden group">
        <div className="relative h-48 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4">
            <motion.div
              className="relative w-16 h-16"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, delay: delay + 0.5 }}
            >
              <svg className="transform -rotate-90" width="64" height="64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={confidence.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 28 * (1 - matchScore / 100) 
                  }}
                  transition={{ duration: 1.5, delay: delay + 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{matchScore}%</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-semibold mb-2">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
            <span className="mx-2">•</span>
            <span>{date}</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ 
                backgroundColor: `${confidence.color}20`, 
                color: confidence.color 
              }}>
              {confidence.label} Confidence
            </span>
          </div>

          {/* Breakdown - shows on hover */}
          <motion.div
            className="space-y-2 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            whileHover={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xs text-muted-foreground border-t border-white/10 pt-4">
              Match Breakdown:
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Text Similarity</span>
              <span className="font-semibold">{textSimilarity}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Image Similarity</span>
              <span className="font-semibold">{imageSimilarity}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Location Relevance</span>
              <span className="font-semibold">{locationRelevance}%</span>
            </div>
          </motion.div>

          <motion.button
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
              text-white rounded-[12px] font-semibold flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            View Match
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
