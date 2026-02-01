import { motion } from "motion/react";
import { useState } from "react";
import { GlassCard } from "./glass-card";
import { StepIndicator } from "./step-indicator";
import { ImageUpload } from "./image-upload";
import { AITooltip } from "./ai-tooltip";
import { MagneticButton } from "./magnetic-button";
import { MapPin, Calendar, Tag, FileText, ArrowLeft, Upload, AlertCircle } from "lucide-react";
import { itemsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface ReportFoundScreenProps {
  onNavigate: (screen: string) => void;
}

export function ReportFoundScreen({ onNavigate }: ReportFoundScreenProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    images: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const steps = ["Item Details", "Location & Date", "Add Photos", "Review"];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return formData.title.trim().length > 0 && 
               formData.category.length > 0 &&
               formData.description.trim().length > 10;
      case 1:
        return formData.location.trim().length > 0 && 
               formData.date.length > 0;
      case 2:
        return true; // Photos are optional
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFoundItemSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onNavigate('home');
    }
  };

  const handleFoundItemSubmit = async () => {
    if (!validateStep(3)) {
      setError('Please complete all steps');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await itemsAPI.reportFound({
        itemName: formData.title,
        description: formData.description,
        category: formData.category,
        foundLocation: formData.location,
        foundDate: formData.date,
        foundTime: new Date().toISOString()
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report found item');
      console.error('Report found error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Report Found Item</h1>
          <p className="text-muted-foreground mb-12">
            Help reunite this item with its owner
          </p>

          <StepIndicator steps={steps} currentStep={currentStep} />

          <GlassCard className="p-8">
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

            {submitSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-2">Found Item Reported!</h2>
                <p className="text-muted-foreground">Looking for the owner...</p>
              </motion.div>
            )}

            {!submitSuccess && (
              <>
                {/* Step 0: Item Details */}
                {currentStep === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-[#06b6d4]" />
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Blue iPhone 14 Pro"
                        className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                          border border-white/20 focus:border-[#06b6d4] focus:outline-none
                          transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-[#06b6d4]" />
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the item you found in detail..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                          border border-white/20 focus:border-[#06b6d4] focus:outline-none
                          transition-colors resize-none"
                      />
                    </div>

                    {formData.description.length > 10 && (
                      <AITooltip
                        text="Great! Detailed descriptions help our AI match this item with lost reports more accurately."
                        delay={500}
                      />
                    )}

                    <div>
                      <label className="mb-2 block">Category</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Electronics", "Keys", "Wallet", "Jewelry", "Documents", "Other"].map((cat) => (
                          <motion.button
                            key={cat}
                            onClick={() => setFormData({ ...formData, category: cat })}
                            className={`px-4 py-3 rounded-[12px] border transition-all ${
                              formData.category === cat
                                ? 'bg-gradient-to-r from-[#0066ff] to-[#06b6d4] text-white border-transparent'
                                : 'bg-white/50 dark:bg-white/5 border-white/20 hover:border-[#06b6d4]'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {cat}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Location & Date */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-[#06b6d4]" />
                        Where did you find it?
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Central Park, New York"
                        className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                          border border-white/20 focus:border-[#06b6d4] focus:outline-none
                          transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-[#06b6d4]" />
                        When did you find it?
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                          border border-white/20 focus:border-[#06b6d4] focus:outline-none
                          transition-colors"
                      />
                    </div>

                    {formData.location && (
                      <div className="h-64 rounded-[12px] bg-muted/30 border border-white/20
                        flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0066ff]/10 to-[#06b6d4]/10" />
                        <div className="text-center relative z-10">
                          <MapPin className="w-16 h-16 mx-auto mb-3 text-[#06b6d4]" />
                          <p className="font-semibold">Location: {formData.location}</p>
                          <p className="text-sm text-muted-foreground">Click to pin exact location on map</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Photos */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-[#06b6d4]" />
                      <h3 className="text-xl font-semibold mb-2">Add Photos</h3>
                      <p className="text-muted-foreground">
                        Upload clear photos to help identify the item
                      </p>
                    </div>

                    <ImageUpload
                      images={formData.images}
                      onImageUpload={(images) => setFormData({ ...formData, images })}
                    />

                    {formData.images.length > 0 && (
                      <AITooltip
                        text="Perfect! Multiple angles help our AI identify and match this item more accurately."
                        delay={1000}
                      />
                    )}
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-semibold mb-6">Review Your Report</h3>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Item Name</div>
                        <div className="font-semibold">{formData.title}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Description</div>
                        <div>{formData.description}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Category</div>
                        <div>{formData.category}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Location</div>
                        <div>{formData.location}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Date</div>
                        <div>{formData.date}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Photos</div>
                        <div>{formData.images.length} image(s) uploaded</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Important Notice</div>
                          <div className="text-blue-700 dark:text-blue-300">
                            By submitting this report, you agree to safely store the item and cooperate with the owner during handover.
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                  {currentStep > 0 && (
                    <motion.button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-6 py-3 rounded-[12px] bg-white/50 dark:bg-white/5
                        border border-white/20 hover:border-[#06b6d4] transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Previous
                    </motion.button>
                  )}
                  <MagneticButton
                    variant="primary"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    {currentStep === steps.length - 1 ? "Submit Report" : "Next Step"}
                  </MagneticButton>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
