import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = true, 
  animated = true 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const LogoIcon = () => (
    <motion.div
      className="relative"
      initial={animated ? { scale: 0.8, opacity: 0 } : {}}
      animate={animated ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={animated ? { 
        scale: 1.05,
      } : {}}
      whileTap={animated ? { scale: 0.95 } : {}}
    >
      {/* Glow Effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      <motion.svg
        viewBox="0 0 600.3 768.3"
        className={`${sizeClasses[size]} ${className} relative z-10 drop-shadow-lg`}
        style={{
          filter: animated ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))' : 'none'
        }}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="logoGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="1" result="innerBlur"/>
            <feComposite in="innerBlur" in2="SourceGraphic" operator="over"/>
          </filter>
        </defs>
        
        {/* Hauptform mit Gradient */}
        <motion.path 
          d="m300.1,1l299.1,91.8v362.1c0,16.8-4.4,42.6-16.6,73.4-9.6,24.1-30.5,65.2-108.9,129.2-38.5,31.4-95.9,72.6-173.6,109.6-77.7-37-135.1-78.1-173.6-109.6-78.4-64.1-99.3-105.1-108.9-129.2-12.2-30.8-16.6-56.6-16.6-73.4V92.8L300.1,1"
          fill="url(#logoGradient)"
          filter="url(#glow)"
          whileHover={animated ? { fill: "url(#logoGradientHover)" } : {}}
          transition={{ duration: 0.3 }}
        />
        
        {/* Innere Details mit Animation */}
        <motion.ellipse 
          cx="300.1" 
          cy="362.1" 
          rx="230.1" 
          ry="240.7" 
          fill="none" 
          stroke="rgba(255,255,255,0.4)" 
          strokeWidth="2"
          animate={animated ? {
            strokeDasharray: [0, 1000],
            strokeDashoffset: [0, -1000],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Zentrale Kompass-Rose mit Pulse-Effekt */}
        <motion.g 
          fill="rgba(255,255,255,0.95)"
          animate={animated ? {
            scale: [1, 1.02, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path d="m300.1,581.1c-.3,0-.6,0-.9,0v21.7c.3,0,.6,0,.9,0s.6,0,.9,0v-21.7c-.3,0-.6,0-.9,0Z"/>
          <path d="m300.1,143.1c.3,0,.6,0,.9,0v-21.7c-.3,0-.6,0-.9,0s-.6,0-.9,0v21.7c.3,0,.6,0,.9,0Z"/>
          <path d="m562.1,362.1c0-73.2-27.2-142-76.7-193.8-5.2-5.4-10.6-10.6-16.1-15.5l-70.4,87.7c-.5-.4-.9-.8-1.4-1.2l70.4-87.7c-47-41.1-105.7-63.5-167.7-63.5s-120.7,22.4-167.7,63.5l70.4,87.7c-.5.4-.9.8-1.4,1.2l-70.4-87.7c-5.5,4.9-10.9,10.1-16.1,15.5-49.5,51.8-76.7,120.6-76.7,193.8s27.2,142,76.7,193.8c5.2,5.4,10.6,10.6,16.1,15.5l70.4-87.7c.5.4.9.8,1.4,1.2l-70.4,87.7c47,41.1,105.7,63.5,167.7,63.5s120.7-22.4,167.7-63.5l-70.4-87.7c.5-.4.9-.8,1.4-1.2l70.4,87.7c5.5-4.9,10.9-10.1,16.1-15.5,49.5-51.8,76.7-120.6,76.7-193.8Z"/>
        </motion.g>
        
        {/* Zusätzliche Glow-Effekte für die Spitzen */}
        <motion.circle
          cx="300.1"
          cy="143.1"
          r="3"
          fill="rgba(255,255,255,0.8)"
          animate={animated ? {
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.circle
          cx="300.1"
          cy="581.1"
          r="3"
          fill="rgba(255,255,255,0.8)"
          animate={animated ? {
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </motion.svg>
    </motion.div>
  );

  if (!showText) {
    return <LogoIcon />;
  }

  return (
    <motion.div 
      className="flex items-center space-x-3"
      initial={animated ? { opacity: 0, x: -20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <LogoIcon />
      <div>
        <motion.h1 
          className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${textSizes[size]}`}
          animate={animated ? {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            backgroundSize: '200% 200%'
          }}
        >
          RevierKompass
        </motion.h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Polizei Baden-Württemberg
        </p>
      </div>
    </motion.div>
  );
};

export default Logo; 