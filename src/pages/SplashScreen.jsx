import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    // Show tagline after HY3N has appeared
    const taglineTimer = setTimeout(() => setShowTagline(true), 900);
    // Navigate to login after full animation
    const navTimer = setTimeout(() => navigate("/login"), 3500);
    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-yellow-500/5 blur-2xl" />
      </div>

      <div className="flex flex-col items-center z-10">
        {/* HY3N logo — appears first with scale + fade */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 32px rgba(212,175,55,0.35))" }}
        >
          <img
            src="/hy3n-logo.png"
            alt="HY3N"
            className="w-72 max-w-xs object-contain"
          />
        </motion.div>

        {/* "Ride With Pride" tagline — fades in after HY3N */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={showTagline ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-2 text-sm tracking-[0.25em] uppercase font-medium"
          style={{ color: "#D4AF37", letterSpacing: "0.3em" }}
        >
          Driver Portal
        </motion.p>
      </div>

      {/* Loading dots at bottom */}
      <motion.div
        className="absolute bottom-16 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#D4AF37" }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
