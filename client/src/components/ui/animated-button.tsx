import * as React from "react";
import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps extends ButtonProps {
  animation?: "scale" | "pulse" | "bounce" | "none";
  hoverEffect?: boolean;
  tapEffect?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    children, 
    animation = "scale", 
    hoverEffect = true,
    tapEffect = true,
    ...props 
  }, ref) => {
    // Animation variants
    const animations = {
      scale: {
        hover: { scale: 1.03, transition: { duration: 0.2 } },
        tap: { scale: 0.97 }
      },
      pulse: {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95 }
      },
      bounce: {
        hover: { y: -4, transition: { type: "spring", stiffness: 300, damping: 10 } },
        tap: { y: 0, scale: 0.95 }
      },
      none: {
        hover: {},
        tap: {}
      }
    };

    return (
      <motion.div
        whileHover={hoverEffect ? animations[animation].hover : undefined}
        whileTap={tapEffect ? animations[animation].tap : undefined}
        className="inline-block"
      >
        <Button 
          ref={ref}
          className={cn("transition-all duration-300", className)}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };