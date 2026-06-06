import { motion } from "framer-motion";

import { useEffect } from "react";
export default function SplashScreen({ onComplete, onDone }) {
  const done = onDone || onComplete;
  useEffect(() => {
    const t = setTimeout(() => done?.(), 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <div className="text-center space-y-8">
        {/* Logo Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <img
            src="https://media.firebaseClient.com/images/public/6a0c20d4cd4c2ab03134bc86/37ea7faf9_ChatGPTImageMay19202605_32_12AM.png"
            alt="Hy3N Driver"
            className="h-64 w-auto mx-auto"
          />
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-yellow-400"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}