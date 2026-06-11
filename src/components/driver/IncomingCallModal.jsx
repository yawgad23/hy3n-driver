/**
 * IncomingCallModal — Incoming call UI for HY3N driver app
 * Shows when the driver receives a call from the rider
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";

export default function IncomingCallModal({ call }) {
  const { status, isIncoming, callerName, acceptCall, declineCall } = call;
  const isVisible = status === "ringing" && isIncoming;
  const ringRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        let stopped = false;

        const ring = () => {
          if (stopped) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 440;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
          ringRef.current = setTimeout(ring, 1200);
        };
        ring();

        return () => {
          stopped = true;
          if (ringRef.current) clearTimeout(ringRef.current);
          ctx.close().catch(() => {});
        };
      } catch {}
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="incoming-call-driver"
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[250] mx-4 mt-4"
          style={{ marginTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          <div className="bg-[#0f2027] border border-blue-500/30 rounded-3xl p-5 shadow-2xl shadow-black/60">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                <div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center relative">
                  <span className="text-xl font-bold text-blue-300">
                    {(callerName || "R")[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium uppercase tracking-widest">Incoming call</p>
                <p className="text-lg font-bold text-white">{callerName || "Rider"}</p>
                <p className="text-xs text-white/40">HY3N In-App Call</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={declineCall}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all"
              >
                <Phone className="w-5 h-5" />
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
