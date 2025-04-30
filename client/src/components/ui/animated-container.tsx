import React from "react";
import { motion, Variants, HTMLMotionProps } from "framer-motion";

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: "fadeIn" | "slideUp" | "slideIn" | "scale" | "bounce" | "pulse" | "reveal";
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  custom?: any;
  motionProps?: Omit<HTMLMotionProps<"div">, "children" | "className" | "custom">;
}

export function AnimatedContainer({
  children,
  animation = "fadeIn",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
  custom,
  motionProps,
  ...props
}: AnimatedContainerProps) {
  const animations: Record<string, Variants> = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { 
          duration, 
          delay,
          ease: "easeOut" 
        }
      }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration, 
          delay,
          ease: "easeOut" 
        }
      }
    },
    slideIn: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { 
          duration, 
          delay,
          ease: "easeOut" 
        }
      }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          duration, 
          delay,
          ease: [0.175, 0.885, 0.32, 1.275] // Custom cubic bezier for bouncy effect
        }
      }
    },
    bounce: {
      hidden: { opacity: 0, y: -20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 10,
          delay 
        }
      }
    },
    pulse: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { 
        opacity: 1, 
        scale: [0.8, 1.05, 1],
        transition: { 
          duration: 0.6, 
          delay,
          times: [0, 0.6, 1]
        }
      }
    },
    reveal: {
      hidden: (custom) => ({
        clipPath: custom?.direction === "rtl" 
          ? "inset(0 0 0 100%)" 
          : "inset(0 100% 0 0)",
        opacity: custom?.opacity ?? 0
      }),
      visible: {
        clipPath: "inset(0 0 0 0)",
        opacity: 1,
        transition: {
          duration: 0.6,
          delay,
          ease: "easeOut"
        }
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={animations[animation]}
      className={className}
      custom={custom}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedList({ 
  children, 
  staggerDelay = 0.1,
  ...props 
}: AnimatedContainerProps & { staggerDelay?: number }) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <>
      {childrenArray.map((child, index) => (
        <AnimatedContainer 
          key={index} 
          delay={index * staggerDelay}
          {...props}
        >
          {child}
        </AnimatedContainer>
      ))}
    </>
  );
}