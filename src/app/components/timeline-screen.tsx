import { motion } from "motion/react";
import { GlassCard } from "./glass-card";
import { RecoveryTimeline } from "./recovery-timeline";
import { MagneticButton } from "./magnetic-button";
import { ArrowLeft, Download, Share2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

interface TimelineScreenProps {
  onNavigate: (screen: string) => void;
}

export function TimelineScreen({ onNavigate }: TimelineScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    setTimeout(() => setShowConfetti(true), 500);
    setTimeout(() => setShowConfetti(false), 5000);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const timelineSteps = [
    {
      label: "Item Reported",
      date: "Jan 28, 2026 - 2:30 PM",
      completed: true,
      active: false,
    },
    {
      label: "AI Match Found",
      date: "Jan 28, 2026 - 2:45 PM",
      completed: true,
      active: false,
    },
    {
      label: "Ownership Verified",
      date: "Jan 28, 2026 - 3:15 PM",
      completed: true,
      active: false,
    },
    {
      label: "Handover Completed",
      date: "Jan 31, 2026 - 11:20 AM",
      completed: true,
      active: false,
    },
    {
      label: "Item Returned Successfully",
      date: "Jan 31, 2026 - 11:20 AM",
      completed: false,
      active: true,
    },
  ];

  return (
    <div className="min-h-screen py-12 px-6 relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={['#0066ff', '#06b6d4', '#14b8a6', '#3b82f6', '#22d3ee']}
        />
      )}

      <div className="container mx-auto max-w-5xl">
        <motion.button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </motion.button>

        {/* Success Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full 
              bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] mb-6"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#0066ff] to-[#06b6d4] bg-clip-text text-transparent">
              Item Recovered Successfully!
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Your iPhone 14 Pro has been returned safely
          </p>

          <div className="flex items-center justify-center gap-4">
            <motion.button
              className="flex items-center gap-2 px-6 py-3 rounded-[12px] 
                bg-white/50 dark:bg-white/5 border border-white/20 hover:border-[#06b6d4]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5" />
              Share Story
            </motion.button>
            <motion.button
              className="flex items-center gap-2 px-6 py-3 rounded-[12px] 
                bg-white/50 dark:bg-white/5 border border-white/20 hover:border-[#06b6d4]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
              Download Receipt
            </motion.button>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-8">
              <h2 className="text-2xl font-semibold mb-8">Recovery Timeline</h2>
              <RecoveryTimeline steps={timelineSteps} />
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Recovery Stats */}
            <GlassCard className="p-8">
              <h3 className="text-xl font-semibold mb-6">Recovery Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Time</span>
                  <span className="font-semibold">3 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Match Confidence</span>
                  <span className="font-semibold text-[#14b8a6]">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verification Score</span>
                  <span className="font-semibold text-[#06b6d4]">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Distance Traveled</span>
                  <span className="font-semibold">0.5 miles</span>
                </div>
              </div>
            </GlassCard>

            {/* Founder Info */}
            <GlassCard className="p-8">
              <h3 className="text-xl font-semibold mb-4">Found By</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                  flex items-center justify-center text-white text-2xl font-bold">
                  JS
                </div>
                <div>
                  <div className="font-semibold">John Smith</div>
                  <div className="text-sm text-muted-foreground">Verified Good Samaritan</div>
                  <div className="text-xs text-[#14b8a6]">★★★★★ 5.0 (47 returns)</div>
                </div>
              </div>
              <MagneticButton variant="secondary" className="w-full">
                Send Thank You Message
              </MagneticButton>
            </GlassCard>

            {/* Action Card */}
            <GlassCard className="p-8 bg-gradient-to-br from-[#0066ff]/10 to-[#06b6d4]/10 
              border-[#06b6d4]/30">
              <h3 className="text-xl font-semibold mb-3">Help Others Too!</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Now that you've recovered your item, help the community by reporting any items you find.
              </p>
              <MagneticButton 
                variant="primary" 
                className="w-full"
                onClick={() => onNavigate('report-found')}
              >
                Report Found Item
              </MagneticButton>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}