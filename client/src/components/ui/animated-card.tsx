import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: "hover" | "tilt" | "float" | "none";
  children: React.ReactNode;
}

export function AnimatedCard({
  animation = "hover",
  children,
  className,
  ...props
}: AnimatedCardProps) {
  // Animation variants
  const animations = {
    hover: {
      rest: { scale: 1 },
      hover: { 
        scale: 1.02,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transition: { duration: 0.3, ease: "easeOut" }
      }
    },
    tilt: {
      rest: { 
        rotateX: 0, 
        rotateY: 0,
        scale: 1
      },
      hover: ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
        // Calculate the card's position and dimensions
        const rect = currentTarget.getBoundingClientRect();
        
        // Calculate the mouse position relative to the card
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Calculate tilt angles based on mouse position
        const tiltX = ((y / rect.height) * 2 - 1) * 5; // Max 5 degrees tilt on X axis
        const tiltY = ((x / rect.width) * 2 - 1) * -5; // Max 5 degrees tilt on Y axis (inverted)
        
        return { 
          rotateX: tiltX, 
          rotateY: tiltY,
          scale: 1.02,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          transition: { duration: 0.3 }
        };
      }
    },
    float: {
      rest: { y: 0 },
      hover: { 
        y: -8, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { type: "spring", stiffness: 300, damping: 15 }
      }
    },
    none: {
      rest: {},
      hover: {}
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={animations[animation]}
      className={cn("transform-gpu", className)}
      {...props}
    >
      <Card className="h-full transition-all duration-300">
        {children}
      </Card>
    </motion.div>
  );
}