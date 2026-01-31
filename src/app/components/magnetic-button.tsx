import { motion } from "motion/react";
import { ReactNode, useRef, useState } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

export function MagneticButton({ 
  children, 
  className = "", 
  onClick,
  variant = "primary" 
}: MagneticButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#0066ff] to-[#06b6d4] text-white hover:shadow-xl hover:shadow-[#0066ff]/30",
    secondary: "bg-gradient-to-r from-[#06b6d4] to-[#14b8a6] text-white hover:shadow-xl hover:shadow-[#06b6d4]/30",
    ghost: "bg-white/10 text-foreground hover:bg-white/20 backdrop-blur-sm border border-white/20",
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`relative px-8 py-4 rounded-[14px] font-semibold transition-all duration-300 
        overflow-hidden ${variantStyles[variant]} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ borderRadius: "inherit" }}
      />
    </motion.button>
  );
}
