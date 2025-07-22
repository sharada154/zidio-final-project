import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, FileSpreadsheet, Sparkles, TrendingUp, Zap } from 'lucide-react';
import winningAnimation from '../components/Auth/animations/winningAnimation- 1750288890316.json';
import Lottie from 'lottie-react';

export default function InteractiveLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [analyticsPosition, setAnalyticsPosition] = useState({ x: 400, y: 300 });
  const [isChasing, setIsChasing] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showGraffiti, setShowGraffiti] = useState(false);
  const containerRef = useRef(null);
  const chaseTimeRef = useRef(0);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Analytics icon movement logic
  useEffect(() => {
    if (!isChasing) return;

    const interval = setInterval(() => {
      chaseTimeRef.current += 50;

      // After 3-4 seconds, start surrendering
      if (chaseTimeRef.current > 3500 && !surrendered) {
        setSurrendered(true);
        // Move to center and stop
        setAnalyticsPosition({ x: 400, y: 300 });
        setTimeout(() => {
          setIsChasing(false);
        }, 1000);
        return;
      }

      if (!surrendered) {
        setAnalyticsPosition(prev => {
          const dx = mousePosition.x - prev.x;
          const dy = mousePosition.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Dynamic speed based on distance and time
          const baseSpeed = distance < 150 ? 15 : 8; // Much faster when close
          const panicMultiplier = distance < 80 ? 2.5 : 1; // Panic mode when very close
          const timeMultiplier = Math.min(chaseTimeRef.current / 1000 * 0.2 + 1, 2); // Gets faster over time

          let speed = baseSpeed * panicMultiplier * timeMultiplier;

          // Add erratic movement patterns
          const erraticAngle = (Math.random() - 0.5) * Math.PI * 0.8; // Random angle deviation
          const baseAngle = Math.atan2(dy, dx) + Math.PI; // Opposite direction from cursor
          const finalAngle = baseAngle + erraticAngle;

          // Add some zigzag movement
          const zigzag = Math.sin(chaseTimeRef.current * 0.01) * 0.5;
          const zigzagAngle = finalAngle + zigzag;

          let newX = prev.x + Math.cos(zigzagAngle) * speed;
          let newY = prev.y + Math.sin(zigzagAngle) * speed;

          // Bounce off walls with some randomness
          const margin = 60;
          const containerWidth = 800;
          const containerHeight = 600;

          if (newX < margin || newX > containerWidth - margin) {
            newX = newX < margin ? margin + Math.random() * 50 : containerWidth - margin - Math.random() * 50;
            // Add random jump when hitting walls
            newY += (Math.random() - 0.5) * 100;
          }
          if (newY < margin || newY > containerHeight - margin) {
            newY = newY < margin ? margin + Math.random() * 50 : containerHeight - margin - Math.random() * 50;
            // Add random jump when hitting walls
            newX += (Math.random() - 0.5) * 100;
          }

          // Ensure bounds
          newX = Math.max(margin, Math.min(containerWidth - margin, newX));
          newY = Math.max(margin, Math.min(containerHeight - margin, newY));

          // Occasional teleport to make it even harder
          if (distance < 60 && Math.random() < 0.15) {
            newX = Math.random() * (containerWidth - 2 * margin) + margin;
            newY = Math.random() * (containerHeight - 2 * margin) + margin;
          }

          return { x: newX, y: newY };
        });
      }
    }, 50); // Faster update rate

    return () => clearInterval(interval);
  }, [mousePosition, isChasing, surrendered]);

  // --- CHASE TIMER LOGIC ---
  useEffect(() => {
    if (!isChasing) return;
    const timer = setTimeout(() => {
      if (!showContent) {
        setSurrendered(true);
        setIsChasing(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isChasing, showContent]);

  // Handle analytics icon click
  const handleAnalyticsClick = () => {
    if (isChasing && !surrendered) {
      setIsChasing(false);
      setShowGraffiti(true);
      setTimeout(() => {
        setShowContent(true);
        setShowGraffiti(false);
      }, 1500); // Show graffiti for 1.5s before showing main content
    } else if (!isChasing && surrendered) {
      // Only allow click after surrender
      // Create explosion particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: analyticsPosition.x,
        y: analyticsPosition.y,
        angle: (i * 18) * Math.PI / 180,
        speed: Math.random() * 5 + 2
      }));
      setParticles(newParticles);
      setTimeout(() => {
        setShowContent(true);
        setParticles([]);
      }, 800);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden cursor-none"
      style={{ height: '100vh', width: '100vw' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              y: [null, -20, null],
              opacity: [0.2, 1, 0.2]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Custom Excel cursor */}
      <motion.div
        className="absolute pointer-events-none z-50"
        animate={{ x: mousePosition.x - 12, y: mousePosition.y - 12 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="relative">
          <FileSpreadsheet
            size={24}
            className="text-green-400 drop-shadow-lg filter"
          />
          {isChasing && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={12} className="text-yellow-400" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Analytics icon being chased */}
      <AnimatePresence>
        {!showContent && (
          <motion.div
            className="absolute cursor-pointer z-40"
            animate={{
              x: analyticsPosition.x - 20,
              y: analyticsPosition.y - 20,
              rotate: surrendered ? 0 : [0, -10, 10, 0]
            }}
            transition={{
              rotate: { duration: 0.5, repeat: surrendered ? 0 : Infinity },
              x: { type: "spring", stiffness: 300, damping: 30 },
              y: { type: "spring", stiffness: 300, damping: 30 }
            }}
            onClick={handleAnalyticsClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative">
              <BarChart3
                size={40}
                className={`${surrendered ? 'text-blue-400' : 'text-red-400'} drop-shadow-lg`}
              />
              {surrendered && (
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs">👋</span>
                  </div>
                </motion.div>
              )}
              {!surrendered && isChasing && (
                <motion.div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  animate={{ y: [-5, -15, -5] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    Too slow! 💨
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion particles */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{ x: particle.x, y: particle.y, scale: 1 }}
            animate={{
              x: particle.x + Math.cos(particle.angle) * 100,
              y: particle.y + Math.sin(particle.angle) * 100,
              scale: 0,
              opacity: 0
            }}
            transition={{ duration: 0.8 }}
          />
        ))}
      </AnimatePresence>

      {/* Graffiti (winning) animation overlay */}
      {showGraffiti && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <Lottie animationData={winningAnimation} loop={false} style={{ width: 400, height: 400 }} />
        </motion.div>
      )}

      {/* Chase instructions */}
      {isChasing && !surrendered && (
        <motion.div
          className="absolute top-10 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-white text-center">
            <p className="text-lg font-semibold">Try to Catch the Speedy Analytics!</p>
            <p className="text-sm opacity-80">It's faster than you think! 🏃‍♂️💨</p>
          </div>
        </motion.div>
      )}

      {/* Surrender message */}
      {surrendered && !showContent && (
        <motion.div
          className="absolute top-10 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-white text-center">
            <p className="text-lg font-semibold">You couldn't catch it! 😅</p>
            <p className="text-sm opacity-80">Click the icon to surrender and continue.</p>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-2xl w-full flex flex-col items-center text-center px-4">
              {/* Brand Title */}
              <motion.h1
                className="text-6xl font-bold text-white mb-2"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  SageExcel
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-xl text-blue-200 mb-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Excel to new heights with SageExcel
              </motion.p>

              {/* Icon showcase */}
              <motion.div
                className="flex items-center space-x-6 mb-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={40} className="text-yellow-400" />
                </motion.div>
                <TrendingUp size={50} className="text-green-400" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BarChart3 size={40} className="text-blue-400" />
                </motion.div>
              </motion.div>

              {/* Tagline */}
              <motion.h2
                className="text-4xl md:text-5xl font-bold text-white mb-6"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Analyze Smarter, Not Harder
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-blue-100 mb-10 max-w-md text-lg"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                Sign in or register to start uploading your Excel files and building beautiful dashboards.
              </motion.p>

              {/* Buttons */}
              <motion.div
                className="flex space-x-6"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <Link to="/login">
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Register
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}