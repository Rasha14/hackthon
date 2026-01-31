import { motion } from "motion/react";
import { ReactNode, useState, MouseEvent } from "react";

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function RippleButton({ 
  children, 
  onClick, 
  className = "",
  variant = "primary" 
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#0066ff] to-[#06b6d4] text-white",
    secondary: "bg-gradient-to-r from-[#06b6d4] to-[#14b8a6] text-white",
    ghost: "bg-white/10 text-foreground backdrop-blur-sm border border-white/20",
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden px-8 py-4 rounded-[14px] font-semibold 
        transition-all duration-300 ${variantStyles[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </button>
  );
}
