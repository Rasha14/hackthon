import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "./components/loading-screen";
import { HomeScreen } from "./components/home-screen";
import { ReportLostScreen } from "./components/report-lost-screen";
import { MatchResultsScreen } from "./components/match-results-screen";
import { VerificationScreen } from "./components/verification-screen";
import { HandoverScreen } from "./components/handover-screen";
import { TimelineScreen } from "./components/timeline-screen";
import { AdminDashboard } from "./components/admin-dashboard";
import { LoginScreen } from "./components/login-screen";

type Screen = 
  | 'home' 
  | 'report-lost' 
  | 'report-found' 
  | 'match-results' 
  | 'verification' 
  | 'handover' 
  | 'timeline'
  | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check system preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={navigate} />;
      case 'report-lost':
      case 'report-found':
        return <ReportLostScreen onNavigate={navigate} />;
      case 'match-results':
        return <MatchResultsScreen onNavigate={navigate} />;
      case 'verification':
        return <VerificationScreen onNavigate={navigate} />;
      case 'handover':
        return <HandoverScreen onNavigate={navigate} />;
      case 'timeline':
        return <TimelineScreen onNavigate={navigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigate} />;
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <div className="relative min-h-screen transition-colors duration-500">
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      {/* Dark Mode Toggle - Only show on non-admin screens */}
      {currentScreen !== 'admin' && (
        <motion.button
          onClick={toggleDarkMode}
          className="fixed top-6 right-6 z-50 w-14 h-14 rounded-full backdrop-blur-xl 
            bg-white/70 dark:bg-white/10 border border-white/20 flex items-center justify-center
            shadow-lg hover:shadow-xl transition-all"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {darkMode ? (
              <motion.div
                key="sun"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Sun className="w-6 h-6 text-yellow-500" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Moon className="w-6 h-6 text-[#0066ff]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Secret Admin Access - Triple click on logo/header */}
      {currentScreen === 'home' && (
        <div
          onClick={(e) => {
            if (e.detail === 3) {
              navigate('admin');
            }
          }}
          className="fixed top-6 left-6 z-50 cursor-pointer"
        >
          <motion.div
            className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl 
              bg-white/70 dark:bg-white/10 border border-white/20"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
              flex items-center justify-center">
              <span className="text-white text-sm font-bold">L&F</span>
            </div>
            <span className="font-bold text-sm">Lost&Found AI+</span>
          </motion.div>
        </div>
      )}

      {/* Screen Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation hint for demo */}
      {currentScreen === 'home' && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full 
            backdrop-blur-xl bg-white/70 dark:bg-white/10 border border-white/20 
            text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          💡 Triple-click the logo to access Admin Dashboard
        </motion.div>
      )}
    </div>
  );
}