import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  Shield, Target, TrendingUp, Sparkles,
  Bell, AlertCircle, LogOut
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { AIParticles } from "./ai-particles";
import { MagneticButton } from "./magnetic-button";
import { StatCard } from "./stat-card";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

interface Match {
  id: string;
  itemId: string;
  matchScore: number;
  confidence: string;
  category?: string;
  description?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
  actionLink?: string;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const enableDemoMode = () => {
    setIsDemoMode(true);
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadMatches();
      loadNotifications();
    }
  }, [isAuthenticated, isLoading]);

  const loadMatches = async () => {
    try {
      setError(null);
      setMatchesLoading(true);
      const response = await api.matches.getUserMatches();
      setMatches(response.matches || []);
    } catch (err) {
      console.error('Failed to load matches:', err);
      // setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setMatchesLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.notifications.getNotifications();
      if (response.notifications) {
        setNotifications(response.notifications);
        setUnreadCount(response.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleNotificationClick = async (id: string, actionLink?: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (actionLink) {
        // Simple client-side routing based on link
        if (actionLink === '/matches') onNavigate('match-results');
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" onClick={() => setShowNotifications(false)}>
      <AIParticles />

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* User Header & Error Banner */}
        <div className="flex justify-between items-center mb-8 relative">
          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                      flex items-center justify-center text-white font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">
                  Trust Score: <span className="font-bold text-[#14b8a6]">{user?.trustScore || 50}</span>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p className="text-lg font-semibold">Welcome to ItemFinder</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-white/10 relative transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] 
                            flex items-center justify-center text-white font-bold border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 border border-white/20 
                          rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id, notification.actionLink)}
                            className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors
                                    ${!notification.read ? 'bg-[#0066ff]/5' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs w-fit px-2 py-0.5 rounded-full 
                                      ${notification.type === 'match' ? 'bg-[#14b8a6]/20 text-[#14b8a6]' : 'bg-[#0066ff]/20 text-[#0066ff]'}`}>
                                {notification.type.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(notification.date).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className={`text-sm mb-0.5 ${!notification.read ? 'font-bold' : 'font-medium'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <>
                <motion.button
                  onClick={() => onNavigate('auth')}
                  className="px-6 py-2 rounded-lg bg-white/10 border border-white/20 
                          hover:bg-white/20 transition-all text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={() => onNavigate('auth')}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                          text-white hover:shadow-lg hover:shadow-[#0066ff]/30 transition-all text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </motion.button>
              </>
            )}
            {isAuthenticated && (
              <motion.button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg 
                        hover:bg-red-500/10 text-red-500 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </motion.button>
            )}
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 
                    flex items-center gap-3 text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
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

          {/* Recent Matches Section - Only show for authenticated users */}
          {isAuthenticated && matches.length > 0 && (
            <motion.div
              className="mt-24 max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Your Matches</h2>
                  <p className="text-muted-foreground">
                    {matches.length} potential match{matches.length !== 1 ? 'es' : ''} found by AI
                  </p>
                </div>
                <MagneticButton
                  variant="primary"
                  onClick={() => onNavigate('match-results')}
                >
                  View All Matches
                </MagneticButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.slice(0, 3).map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                    onClick={() => onNavigate('match-results')}
                    className="cursor-pointer group"
                  >
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20
                      rounded-[16px] p-6 hover:shadow-2xl hover:shadow-[#06b6d4]/10
                      transition-all duration-300 group-hover:border-[#06b6d4]/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#06b6d4]
                          text-xs font-semibold">
                          {match.category || 'Item'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-[#14b8a6]">{Math.round(match.matchScore)}%</span>
                          <span className="text-xs text-muted-foreground">Match</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {match.description || 'AI-matched item'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded
                          ${match.confidence === 'high' ? 'bg-green-500/20 text-green-600' :
                            match.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                              'bg-red-500/20 text-red-600'}`}>
                          {match.confidence?.charAt(0).toUpperCase() + match.confidence?.slice(1) || 'Unknown'} Confidence
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-[#06b6d4] transition">
                          Review →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
