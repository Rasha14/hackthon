import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { GlassCard } from "./glass-card";
import { Shield, ArrowLeft, Unlock, AlertCircle } from "lucide-react";
import { MagneticButton } from "./magnetic-button";
import { handoversAPI, itemsAPI } from "../../services/api";

interface VerificationScreenProps {
  onNavigate: (screen: string) => void;
  matchData?: any;
}

export function VerificationScreen({ onNavigate }: VerificationScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    if (timeLeft > 0 && !showSuccess) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, showSuccess]);

  // Fetch AI-generated questions when matchData is available
  useEffect(() => {
    if (matchData && matchData.found_item) {
      const fetchQuestions = async () => {
        try {
          setIsLoading(true);
          // Use the backend service to generate questions based on item category
          const response = await itemsAPI.generateVerificationQuestions(matchData.found_item.category);
          // Convert backend format to component format
          const formattedQuestions = (response.questions || []).map((q: any) => ({
            question: q.question,
            options: q.type === 'boolean' ? ['Yes', 'No'] :
                     q.type === 'number' ? ['1', '2', '3', '4', '5+'] :
                     ['Option A', 'Option B', 'Option C', 'Option D'] // Default options for text type
          }));
          setQuestions(formattedQuestions);
        } catch (err) {
          console.error('Failed to fetch verification questions:', err);
          // Fallback to default questions if API fails
          setQuestions([
            { question: "What is the primary color of the item?", type: "text" },
            { question: "Are there any distinctive marks or labels?", type: "text" },
            { question: "What is the approximate size of the item?", type: "text" }
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [matchData]);

  const handleAnswer = async (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
    } else {
      // All questions answered, submit verification
      try {
        setIsLoading(true);
        const result = await handoversAPI.verifyOwner({
          matchId: selectedMatch.id,
          answers: newAnswers
        });

        setVerificationResult(result);
        setShowSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Verification failed');
        // Still set the result if available (for trust score display)
        if (err.updated_trust_score) {
          setVerificationResult(err);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-16 h-16 text-[#06b6d4]" />
        </motion.div>
      </div>
    );
  }

  if (showSuccess && verificationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center max-w-md"
        >
          <motion.div
            className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4]
              flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <Unlock className="w-16 h-16 text-white" />
          </motion.div>

          <motion.h2
            className="text-4xl font-bold mb-4 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Verification Successful!
          </motion.h2>

          <motion.p
            className="text-xl text-gray-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            You've been verified as the rightful owner
          </motion.p>

          {verificationResult.updated_trust_score && (
            <motion.div
              className="bg-white/10 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-sm text-gray-300 mb-1">Trust Score Updated</p>
              <p className="text-2xl font-bold text-[#14b8a6]">
                {verificationResult.updated_trust_score}/100
              </p>
            </motion.div>
          )}

          <MagneticButton variant="primary" onClick={() => onNavigate('handover')}>
            Continue to Handover
          </MagneticButton>
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
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-white">Verification Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>

          {verificationResult?.updated_trust_score && (
            <motion.div
              className="bg-white/10 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-sm text-gray-300 mb-1">Trust Score Updated</p>
              <p className="text-2xl font-bold text-red-400">
                {verificationResult.updated_trust_score}/100
              </p>
            </motion.div>
          )}

          <div className="flex gap-4">
            <MagneticButton variant="secondary" onClick={() => onNavigate('match-results')}>
              Try Different Match
            </MagneticButton>
            <MagneticButton variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
      <div className="container mx-auto max-w-3xl">
        <motion.button
          onClick={() => onNavigate('match-results')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full 
              bg-gradient-to-r from-[#0066ff]/20 to-[#06b6d4]/20 border-2 border-[#06b6d4] mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-[#06b6d4]" />
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-4 text-white">Ownership Verification</h1>
          <p className="text-gray-300 text-lg mb-6">
            Answer these AI-generated questions to verify ownership
          </p>

          {/* Progress Bar */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex-1 max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-white font-semibold">
              {currentQuestion + 1}/{questions.length}
            </span>
          </div>

          {/* Timer */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
              bg-white/10 border border-white/20"
            animate={{ 
              borderColor: timeLeft < 30 ? "#ef4444" : "rgba(255,255,255,0.2)" 
            }}
          >
            <span className="text-white font-mono">{formatTime(timeLeft)}</span>
          </motion.div>
        </motion.div>

        <GlassCard className="p-8 relative overflow-hidden">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-8 text-white">
              {questions[currentQuestion].question}
            </h2>

            <div className="grid gap-4">
              {questions[currentQuestion].options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="w-full p-6 rounded-[14px] bg-white/5 border-2 border-white/10 
                    hover:border-[#06b6d4] hover:bg-white/10 transition-all text-left text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                      flex items-center justify-center font-semibold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Spotlight effect */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/20 via-transparent to-[#06b6d4]/20" />
          </div>
        </GlassCard>

        <motion.div
          className="text-center mt-8 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          All answers are encrypted and used only for verification
        </motion.div>
      </div>
    </div>
  );
}
