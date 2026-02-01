import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "./components/loading-screen";
import { AuthScreen } from "./components/auth-screen";
import { HomeScreen } from "./components/home-screen";
import { ReportLostScreen } from "./components/report-lost-screen";
import { MatchResultsScreen } from "./components/match-results-screen";
import { VerificationScreen } from "./components/verification-screen";
import { HandoverScreen } from "./components/handover-screen";
import { TimelineScreen } from "./components/timeline-screen";
import { AdminDashboard } from "./components/admin-dashboard";
import { ProfileScreen } from "./components/profile-screen";

/**
 * Screen types for navigation
 */
type Screen =
  | 'home'
  | 'auth'
  | 'profile'
  | 'report-lost'
  | 'report-found'
  | 'match-results'
  | 'verification'
  | 'handover'
  | 'timeline'
  | 'admin';

/**
 * Protected Route Component
 */
interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

function ProtectedRoute({ 
  isAuthenticated, 
  isAdmin = false, 
  children, 
  fallback = null 
}: ProtectedRouteProps) {
  if (isAdmin && !isAuthenticated) {
    return fallback;
  }
  if (!isAuthenticated) {
    return fallback;
  }
  return <>{children}</>;
}

/**
 * Main App Component
 */
export default function App() {
  const { isAuthenticated, isAdmin, user, isLoading: authLoading, error: authError, clearError } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  /**
   * Initialize app on mount
   */
  useEffect(() => {
    // Check system preference for dark mode
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Update document class for dark mode
   */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  /**
   * Show error banner when auth error occurs
   */
  useEffect(() => {
    if (authError) {
      setShowErrorBanner(true);
      const timer = setTimeout(() => {
        setShowErrorBanner(false);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authError, clearError]);

  /**
   * Validate screen access based on auth status
   */
  useEffect(() => {
    const protectedScreens: Screen[] = [
      'profile',
      'report-lost',
      'report-found',
      'match-results',
      'verification',
      'handover',
      'timeline'
    ];

    // Redirect to home if trying to access protected screen without auth
    if (protectedScreens.includes(currentScreen) && !isAuthenticated) {
      setCurrentScreen('home');
    }

    // Redirect to home if trying to access admin without admin role
    if (currentScreen === 'admin' && (!isAuthenticated || !isAdmin)) {
      setCurrentScreen('home');
    }
  }, [isAuthenticated, isAdmin, currentScreen]);

  /**
   * Toggle dark mode
   */
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  /**
   * Navigate between screens
   */
  const navigate = (screen: string | Screen) => {
    setCurrentScreen(screen as Screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Render current screen based on navigation state
   */
  const renderScreen = () => {
    // Show home screen while auth is loading
    if (authLoading) {
      return <HomeScreen onNavigate={navigate} />;
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={navigate} />;
      
      case 'auth':
        return <AuthScreen onNavigate={navigate} />;

      case 'profile':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProfileScreen onNavigate={navigate} />
          </ProtectedRoute>
        );

      case 'report-lost':
      case 'report-found':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ReportLostScreen onNavigate={navigate} />
          </ProtectedRoute>
        );
      
      case 'match-results':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MatchResultsScreen onNavigate={navigate} />
          </ProtectedRoute>
        );
      
      case 'verification':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <VerificationScreen onNavigate={navigate} />
          </ProtectedRoute>
        );
      
      case 'handover':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <HandoverScreen onNavigate={navigate} />
          </ProtectedRoute>
        );
      
      case 'timeline':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <TimelineScreen onNavigate={navigate} />
          </ProtectedRoute>
        );
      
      case 'admin':
        return (
          <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={true}>
            <AdminDashboard onNavigate={navigate} />
          </ProtectedRoute>
        );
      
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      {/* Auth Error Banner */}
      <AnimatePresence>
        {showErrorBanner && authError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[1000] bg-red-500/90 backdrop-blur-md"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              <p className="text-white text-sm flex-1">{authError}</p>
              <button
                onClick={() => {
                  setShowErrorBanner(false);
                  clearError();
                }}
                className="text-white hover:bg-white/20 px-3 py-1 rounded text-sm"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      {/* Dark Mode Toggle - Fixed position */}
      {!isLoading && currentScreen !== 'admin' && (
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
          aria-label="Toggle dark mode"
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

      {/* App Logo/Header - Click to access screens */}
      {!isLoading && currentScreen === 'home' && (
        <motion.div
          onClick={(e) => {
            // Triple click to access admin
            if (e.detail === 3 && isAuthenticated && isAdmin) {
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
        </motion.div>
      )}

      {/* Screen Transition with Animation */}
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

      {/* Navigation hint - Home screen only */}
      {!isLoading && currentScreen === 'home' && isAuthenticated && isAdmin && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full 
            backdrop-blur-xl bg-white/70 dark:bg-white/10 border border-white/20 
            text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          💡 Triple-click the logo to access Admin Dashboard
        </motion.div>
      )}
    </div>
  );
}