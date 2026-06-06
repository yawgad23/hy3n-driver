import { motion } from "framer-motion";
import { useEffect } from "react";

export default function SplashScreen({ onComplete, onDone }) {
  const done = onDone || onComplete;
  useEffect(() => {
    const t = setTimeout(() => done?.(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* HY3N Logo only */}
      <motion.img
        src="/hy3n-logo-transparent.png"
        alt="HY3N Driver"
        className="w-80 max-w-xs object-contain z-10"
        style={{ filter: "drop-shadow(0 0 28px rgba(212,175,55,0.4))" }}
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-yellow-400"
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
