import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { MatchCard } from "./match-card";
import { MagneticButton } from "./magnetic-button";
import { ArrowLeft, Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { matchesAPI } from "../../services/api";

interface MatchResultsScreenProps {
  onNavigate: (screen: string) => void;
  lostItemId?: string;
}

interface Match {
  id: string;
  match_score: number;
  score_breakdown: {
    textSimilarity: number;
    locationMatch: number;
    timeRelevance: number;
    imageSimilarity: number;
  };
  found_item: any;
}

export function MatchResultsScreen({ onNavigate }: MatchResultsScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    // In a real app, this would be passed from previous screen
    // For now, simulate loading demo data
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        // Simulated matches data - in production, fetch from API
        const demoMatches: Match[] = [
          {
            id: "match1",
            match_score: 92,
            score_breakdown: {
              textSimilarity: 95,
              locationMatch: 98,
              timeRelevance: 85,
              imageSimilarity: 78
            },
            found_item: {
              name: "Blue iPhone 14 Pro",
              category: "phone",
              description: "Blue iPhone with screen protector",
              location: "Campus Library",
              image_url: "https://via.placeholder.com/300"
            }
          },
          {
            id: "match2",
            match_score: 78,
            score_breakdown: {
              textSimilarity: 82,
              locationMatch: 75,
              timeRelevance: 72,
              imageSimilarity: 65
            },
            found_item: {
              name: "Phone Case",
              category: "phone",
              description: "Blue phone with case",
              location: "Campus Cafeteria",
              image_url: "https://via.placeholder.com/300"
            }
          },
          {
            id: "match3",
            match_score: 65,
            score_breakdown: {
              textSimilarity: 70,
              locationMatch: 62,
              timeRelevance: 58,
              imageSimilarity: 52
            },
            found_item: {
              name: "Electronics",
              category: "phone",
              description: "Blue electronic device",
              location: "Campus Entrance",
              image_url: "https://via.placeholder.com/300"
            }
          }
        ];
        
        setMatches(demoMatches);
      } catch (err) {
        setError("Failed to load matches");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, []);

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    // Store the match data for the verification screen
    localStorage.setItem('selectedMatch', JSON.stringify(match));
    onNavigate('verification');
  };

  // Animated score ring component
  const ScoreRing = ({ score }: { score: number }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getColor = () => {
      if (score >= 80) return "#14b8a6"; // teal
      if (score >= 60) return "#06b6d4"; // cyan
      return "#0066ff"; // blue
    };

    return (
      <div className="relative w-32 h-32">
        <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Animated score circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}%
            </motion.div>
            <div className="text-xs text-gray-400">Match Score</div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-[#06b6d4]" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
          <MagneticButton onClick={() => onNavigate('home')} variant="primary">
            Return to Home
          </MagneticButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
      <div className="container mx-auto max-w-6xl">
        <motion.button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-[#14b8a6]" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white">AI Match Results</h1>
          </div>
          <p className="text-gray-300 text-lg">
            {matches.length === 0 ? "No matches found" : `We found ${matches.length} potential matches for your lost item`}
          </p>
        </motion.div>

        {matches.length > 0 ? (
          <div className="space-y-6 mb-12">
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => handleSelectMatch(match)}
              >
                <div className="relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-6 
                  backdrop-blur-xl hover:border-[#06b6d4]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#06b6d4]/20">
                  {/* Best match indicator */}
                  {index === 0 && (
                    <motion.div
                      className="absolute -top-3 -right-3 bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] 
                        rounded-full p-2"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                  )}

                  <div className="flex gap-6 items-start">
                    {/* Score Ring */}
                    <div className="flex-shrink-0">
                      <ScoreRing score={match.match_score} />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{match.found_item.name}</h3>
                      <p className="text-gray-300 mb-4">{match.found_item.description}</p>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Text Match</p>
                          <motion.p
                            className="text-lg font-bold text-[#06b6d4]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {match.score_breakdown.textSimilarity.toFixed(0)}%
                          </motion.p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Location</p>
                          <motion.p
                            className="text-lg font-bold text-[#14b8a6]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {match.score_breakdown.locationMatch.toFixed(0)}%
                          </motion.p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Time</p>
                          <motion.p
                            className="text-lg font-bold text-cyan-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            {match.score_breakdown.timeRelevance.toFixed(0)}%
                          </motion.p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Image</p>
                          <motion.p
                            className="text-lg font-bold text-blue-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {match.score_breakdown.imageSimilarity.toFixed(0)}%
                          </motion.p>
                        </div>
                      </div>

                      {/* Location and Time */}
                      <div className="flex gap-4 text-sm text-gray-400 mb-4">
                        <span>📍 {match.found_item.location}</span>
                        <span>🕐 {new Date().toLocaleDateString()}</span>
                      </div>

                      {/* Action Button */}
                      <MagneticButton 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMatch(match);
                        }}
                      >
                        Verify Ownership
                      </MagneticButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-6">No matches found for your item yet.</p>
            <MagneticButton variant="primary" onClick={() => onNavigate('home')}>
              Report Another Item
            </MagneticButton>
          </motion.div>
        )}

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-400 mb-6">
            We'll continue scanning for new matches. Check back regularly!
          </p>
          <MagneticButton variant="ghost" onClick={() => onNavigate('home')}>
            Return to Home
          </MagneticButton>
        </motion.div>
      </div>
    </div>
  );
}
