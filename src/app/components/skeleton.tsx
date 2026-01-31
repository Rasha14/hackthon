import { motion } from "motion/react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-white/20 to-white/30 dark:from-white/5 dark:to-white/10";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-[12px]",
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/20 
      shadow-lg rounded-[16px] overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <Skeleton className="h-10 w-full rounded-[12px]" />
      </div>
    </div>
  );
}
