import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { User, Phone, Camera, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { MagneticButton } from "./magnetic-button";

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // Only send fields that have changed
      const updates: any = {};
      if (formData.name !== user.name) updates.name = formData.name;
      if (formData.phone !== user.phone) updates.phone = formData.phone;

      if (Object.keys(updates).length === 0) {
        setError('No changes to save');
        return;
      }

      await updateProfile(updates);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    if (!user) return false;
    return (
      formData.name !== user.name ||
      formData.phone !== user.phone
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/5 via-[#06b6d4]/5 to-[#14b8a6]/5" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <motion.button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-muted-foreground hover:text-[#0066ff]
              transition-colors mb-6"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </motion.button>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4]
              flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your personal information</p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20
            rounded-[16px] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5
                    text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/50 dark:bg-white/10
                      border border-white/20 focus:border-[#0066ff] focus:ring-2
                      focus:ring-[#0066ff]/20 transition-all outline-none"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5
                    text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/50 dark:bg-white/10
                      border border-white/20 focus:border-[#0066ff] focus:ring-2
                      focus:ring-[#0066ff]/20 transition-all outline-none"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30
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
                  className="p-4 rounded-lg bg-green-500/10 border border-green-500/30
                    flex items-center gap-3 text-green-600 dark:text-green-400"
                >
                  <Save className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">Profile updated successfully!</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <MagneticButton
                  type="submit"
                  variant="primary"
                  disabled={!hasChanges() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white
                        rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </MagneticButton>

                <MagneticButton
                  type="button"
                  variant="secondary"
                  onClick={() => onNavigate('home')}
                  className="flex-1"
                >
                  Cancel
                </MagneticButton>
              </div>
            </form>
          </div>
        </motion.div>

        {/* User Stats */}
        {user && (
          <motion.div
            className="max-w-2xl mx-auto mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20
              rounded-[16px] p-6">
              <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0066ff]">{user.trustScore}</div>
                  <div className="text-sm text-muted-foreground">Trust Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#06b6d4]">{user.itemsReported || 0}</div>
                  <div className="text-sm text-muted-foreground">Items Reported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#14b8a6]">{user.itemsRecovered || 0}</div>
                  <div className="text-sm text-muted-foreground">Items Recovered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#f59e0b]">{user.role || 'User'}</div>
                  <div className="text-sm text-muted-foreground">Role</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
