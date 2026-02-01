import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { GlassCard } from "./glass-card";
import { MagneticButton } from "./magnetic-button";
import { AIParticles } from "./ai-particles";

interface AuthScreenProps {
  onNavigate?: (screen: string) => void;
  onClose?: () => void;
}

export function AuthScreen({ onNavigate, onClose }: AuthScreenProps) {
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.email) return "Email is required";
    if (!validateEmail(formData.email)) return "Invalid email format";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";

    if (isSignUp) {
      if (!formData.name) return "Name is required";
      if (formData.confirmPassword !== formData.password) return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await register(
          formData.email,
          formData.password,
          formData.name,
          formData.phone
        );
      } else {
        await login(formData.email, formData.password);
      }

      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: "",
      });

      setTimeout(() => {
        if (onClose) onClose();
        if (onNavigate) onNavigate("home");
      }, 1500);
    } catch (err: any) {
      setError(err.message || `Failed to ${isSignUp ? "sign up" : "sign in"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AIParticles />

      <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-muted-foreground">
                {isSignUp
                  ? "Join us and help reunite lost items with their owners"
                  : "Sign in to your account to continue"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 
                  flex items-center gap-3 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 
                  flex items-center gap-3 text-green-600 dark:text-green-400"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  {isSignUp ? "Account created successfully! Redirecting..." : "Logged in successfully!"}
                </p>
              </motion.div>
            )}

            {/* Form Card */}
            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field (Sign Up Only) */}
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <User className="w-4 h-4 text-[#06b6d4]" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                        border border-white/20 focus:border-[#06b6d4] focus:outline-none
                        transition-colors"
                    />
                  </motion.div>
                )}

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isSignUp ? 0.1 : 0 }}
                >
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Mail className="w-4 h-4 text-[#06b6d4]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                      border border-white/20 focus:border-[#06b6d4] focus:outline-none
                      transition-colors"
                  />
                </motion.div>

                {/* Phone Field (Sign Up Only) */}
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Phone className="w-4 h-4 text-[#06b6d4]" />
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                        border border-white/20 focus:border-[#06b6d4] focus:outline-none
                        transition-colors"
                    />
                  </motion.div>
                )}

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isSignUp ? 0.3 : 0.1 }}
                >
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Lock className="w-4 h-4 text-[#06b6d4]" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                        border border-white/20 focus:border-[#06b6d4] focus:outline-none
                        transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password Field (Sign Up Only) */}
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Lock className="w-4 h-4 text-[#06b6d4]" />
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                          border border-white/20 focus:border-[#06b6d4] focus:outline-none
                          transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <MagneticButton
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </MagneticButton>
              </form>

              {/* Toggle Sign In/Up */}
              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </p>
                <motion.button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="text-[#06b6d4] hover:text-[#0066ff] font-semibold transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSignUp ? "Sign In Instead" : "Create New Account"}
                </motion.button>
              </div>
            </GlassCard>

            {/* Close Button */}
            {onClose && (
              <motion.button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2 rounded-lg
                  bg-white/5 border border-white/20 hover:bg-white/10
                  transition-colors text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
