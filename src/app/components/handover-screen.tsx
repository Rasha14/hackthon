import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { GlassCard } from "./glass-card";
import { MagneticButton } from "./magnetic-button";
import { MapPin, QrCode, ArrowLeft, CheckCircle2, AlertCircle, Clock, Copy, Eye, EyeOff } from "lucide-react";
import { handoversAPI } from "../../services/api";

interface HandoverScreenProps {
  onNavigate: (screen: string) => void;
}

export function HandoverScreen({ onNavigate }: HandoverScreenProps) {
  const [otp, setOtp] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoverData, setHandoverData] = useState<any>(null);

  useEffect(() => {
    // Generate OTP
    setOtp(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHolding && holdProgress < 100) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            setConfirmed(true);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
    } else if (!isHolding) {
      setHoldProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, holdProgress]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-white">Handover Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4">
            <MagneticButton variant="secondary" onClick={() => onNavigate('verification')}>
              Try Again
            </MagneticButton>
            <MagneticButton variant="primary" onClick={() => window.location.reload()}>
              Retry
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    );
  }

  if (confirmed) {
    setTimeout(() => onNavigate('timeline'), 2000);
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.button
          onClick={() => onNavigate('verification')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
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
          <h1 className="text-4xl font-bold mb-4">Secure Handover</h1>
          <p className="text-muted-foreground text-lg">
            Meet at the verified location and complete the handover
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-[#06b6d4]" />
                <h3 className="text-xl font-semibold">Meeting Location</h3>
              </div>
              
              <div className="h-80 rounded-[12px] bg-muted/30 border border-white/20 
                flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/10 to-[#06b6d4]/10" />
                <div className="text-center relative z-10">
                  <MapPin className="w-16 h-16 mx-auto mb-3 text-[#06b6d4]" />
                  <p className="font-semibold">Starbucks - Times Square</p>
                  <p className="text-sm text-muted-foreground">1585 Broadway, New York</p>
                </div>
                
                {/* Pulsing marker */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-6 h-6 -mt-3 -ml-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-full h-full rounded-full bg-[#06b6d4]/50" />
                </motion.div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-semibold">0.5 miles away</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ETA</span>
                  <span className="font-semibold">12 minutes</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* OTP/QR Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <QrCode className="w-6 h-6 text-[#14b8a6]" />
                <h3 className="text-xl font-semibold">Verification Code</h3>
              </div>

              <div className="flex items-center justify-center mb-6">
                <motion.button
                  onClick={() => setShowQR(!showQR)}
                  className="text-sm text-[#06b6d4] hover:underline"
                  whileHover={{ scale: 1.05 }}
                >
                  {showQR ? "Show OTP" : "Show QR Code"}
                </motion.button>
              </div>

              {!showQR ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-8"
                >
                  <div className="text-sm text-muted-foreground mb-4">
                    Share this code with the person
                  </div>
                  <motion.div
                    className="text-6xl font-bold tracking-wider mb-4 bg-gradient-to-r 
                      from-[#0066ff] to-[#06b6d4] bg-clip-text text-transparent"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {otp}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">
                    Code expires in 15:00 minutes
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center mb-8"
                >
                  <div className="w-64 h-64 bg-white rounded-[12px] p-4 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-[#0066ff] to-[#06b6d4] 
                      rounded-[8px] flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-white" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="p-4 rounded-[12px] bg-[#14b8a6]/10 border border-[#14b8a6]/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#14b8a6] flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-[#14b8a6] mb-1">Safety Tip</div>
                      <div className="text-muted-foreground">
                        Only meet in public places and verify the person's identity before handing over the item.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Confirm Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8 relative overflow-hidden">
            {confirmed ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r 
                    from-[#14b8a6] to-[#06b6d4] flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Exchange Confirmed!</h3>
                <p className="text-muted-foreground">Redirecting to timeline...</p>
              </motion.div>
            ) : (
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-center">Confirm Item Exchange</h3>
                <p className="text-muted-foreground text-center mb-8">
                  Hold the button below to confirm you've received your item
                </p>

                <div className="relative">
                  <motion.button
                    onMouseDown={() => setIsHolding(true)}
                    onMouseUp={() => setIsHolding(false)}
                    onMouseLeave={() => setIsHolding(false)}
                    onTouchStart={() => setIsHolding(true)}
                    onTouchEnd={() => setIsHolding(false)}
                    className="w-full py-6 rounded-[14px] bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                      text-white font-semibold text-lg relative overflow-hidden"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">
                      {isHolding ? "Hold to Confirm..." : "Hold to Confirm Exchange"}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: holdProgress / 100 }}
                      style={{ transformOrigin: "left" }}
                    />
                  </motion.button>

                  {isHolding && (
                    <motion.div
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 
                        bg-white dark:bg-gray-900 rounded-full shadow-lg text-sm font-semibold"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {Math.floor(holdProgress)}%
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
