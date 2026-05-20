import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD + 20));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150"
          style={{ height: refreshing ? PULL_THRESHOLD : pullDistance }}
        >
          <div
            className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-all ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{ opacity: progress, transform: `rotate(${progress * 360}deg)` }}
          >
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}