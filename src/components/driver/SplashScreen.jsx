import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete, onDone }) {
  const done = onDone || onComplete;
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const taglineTimer = setTimeout(() => setShowTagline(true), 900);
    const doneTimer = setTimeout(() => done?.(), 3500);
    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-yellow-500/5 blur-2xl" />
      </div>

      <div className="flex flex-col items-center z-10">
        {/* HY3N logo — appears first */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 32px rgba(212,175,55,0.35))" }}
        >
          <img
            src="/hy3n-logo.png"
            alt="HY3N Driver"
            className="w-72 max-w-xs object-contain"
          />
        </motion.div>

        {/* "Driver Portal" tagline — fades in after HY3N */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={showTagline ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-2 text-sm font-medium"
          style={{ color: "#D4AF37", letterSpacing: "0.3em" }}
        >
          Driver Portal
        </motion.p>
      </div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#D4AF37" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
