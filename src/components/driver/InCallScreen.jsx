/**
 * InCallScreen — Full-screen in-call UI for HY3N driver app
 */
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";

export default function InCallScreen({ call, otherName, otherRole = "rider" }) {
  const { status, isMuted, isSpeaker, formattedDuration, callError, endCall, toggleMute, toggleSpeaker } = call;

  const isVisible = status === "calling" || status === "active";
  if (!isVisible) return null;

  const isCalling = status === "calling";

  return (
    <AnimatePresence>
      <motion.div
        key="incall-driver"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-gradient-to-b from-[#0f2027] to-[#203a43] text-white"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Top section */}
        <div className="flex flex-col items-center pt-20 gap-4">
          <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center">
            <span className="text-4xl font-bold text-blue-300">
              {(otherName || otherRole)[0]?.toUpperCase()}
            </span>
          </div>

          <p className="text-2xl font-bold tracking-wide">{otherName || "Rider"}</p>
          <p className="text-sm text-white/50 capitalize">{otherRole}</p>

          <div className="mt-2">
            {isCalling ? (
              <div className="flex items-center gap-2 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-base font-medium">Calling...</span>
              </div>
            ) : (
              <p className="text-2xl font-mono font-semibold text-green-400">{formattedDuration}</p>
            )}
          </div>

          {callError && (
            <p className="text-red-400 text-sm text-center px-8 mt-2">{callError}</p>
          )}
        </div>

        {/* Bottom controls */}
        <div className="w-full px-10 pb-16">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center gap-2 w-16 h-16 rounded-full justify-center transition-all ${
                isMuted ? "bg-red-500/80" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              <span className="text-[10px] text-white/60">{isMuted ? "Unmute" : "Mute"}</span>
            </button>

            <button
              onClick={endCall}
              className="flex flex-col items-center gap-2 w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 justify-center transition-all shadow-lg shadow-red-900/50"
            >
              <PhoneOff className="w-8 h-8" />
              <span className="text-[10px] text-white/80">End</span>
            </button>

            <button
              onClick={toggleSpeaker}
              className={`flex flex-col items-center gap-2 w-16 h-16 rounded-full justify-center transition-all ${
                isSpeaker ? "bg-blue-500/80" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              <span className="text-[10px] text-white/60">Speaker</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
