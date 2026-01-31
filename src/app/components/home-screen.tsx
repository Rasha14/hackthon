import { motion } from "motion/react";
import { AIParticles } from "./ai-particles";
import { MagneticButton } from "./magnetic-button";
import { StatCard } from "./stat-card";
import { Shield, Target, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { isDemoMode, enableDemoMode } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AIParticles />
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          className="text-center max-w-4xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
              bg-gradient-to-r from-[#06b6d4]/20 to-[#14b8a6]/20 
              border border-[#06b6d4]/30 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-[#14b8a6]" />
            <span className="text-sm font-semibold text-[#14b8a6]">
              Powered by Advanced AI
            </span>
          </motion.div>

          <motion.h1
            className="text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-[#0066ff] to-[#06b6d4] bg-clip-text text-transparent">
              Lost something?
            </span>
            <br />
            Let AI bring it back — safely.
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            The world's most intelligent lost and found platform. 
            Powered by AI matching, blockchain verification, and secure handover protocols.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MagneticButton
              variant="primary"
              onClick={() => onNavigate('report-lost')}
            >
              Report Lost Item
            </MagneticButton>
            <MagneticButton
              variant="secondary"
              onClick={() => onNavigate('report-found')}
            >
              I Found an Item
            </MagneticButton>
          </motion.div>

          {/* Demo Mode Button */}
          {!isDemoMode && (
            <motion.div
              className="flex items-center justify-center mt-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button
                onClick={enableDemoMode}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#d97706]
                  text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#f59e0b]/25
                  transition-all duration-300 border border-[#f59e0b]/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Try Demo Mode (Preloaded Data)
              </motion.button>
            </motion.div>
          )}

          {isDemoMode && (
            <motion.div
              className="flex items-center justify-center mt-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="px-6 py-3 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669]
                text-white font-semibold text-sm border border-[#10b981]/30">
                🎯 Demo Mode Active - Fast Matching Enabled
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
          <StatCard
            icon={Target}
            value={12847}
            label="Items Recovered"
            delay={0.6}
            color="#0066ff"
          />
          <StatCard
            icon={TrendingUp}
            value={94}
            label="Success Rate"
            suffix="%"
            delay={0.7}
            color="#06b6d4"
          />
          <StatCard
            icon={Shield}
            value={99.9}
            label="Fraud Prevention"
            suffix="%"
            delay={0.8}
            color="#14b8a6"
          />
        </div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            {
              title: "AI-Powered Matching",
              description: "Our neural network analyzes images, text, and location to find perfect matches instantly.",
              icon: "🤖"
            },
            {
              title: "Secure Verification",
              description: "Multi-layer AI verification questions ensure only the real owner can claim items.",
              icon: "🔒"
            },
            {
              title: "Safe Handover",
              description: "GPS-tracked handover locations and QR code verification for secure item returns.",
              icon: "🤝"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20 
                rounded-[16px] p-8 hover:shadow-2xl hover:shadow-[#0066ff]/10 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
