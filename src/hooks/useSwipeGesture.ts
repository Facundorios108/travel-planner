import { useState, useRef, TouchEvent } from "react";
import { hapticFeedback } from "@/utils/haptics";

interface UseSwipeGestureOptions {
  onSwipeLeftCompleted?: () => void;
  threshold?: number; // swipe offset needed to trigger action (e.g., 75px)
}

export function useSwipeGesture({ onSwipeLeftCompleted, threshold = 75 }: UseSwipeGestureOptions = {}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const currentOffset = useRef(0);
  const hasTriggeredHaptic = useRef(false);

  const onTouchStart = (e: TouchEvent) => {
    // Only capture single-touch events
    if (e.touches.length !== 1) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
    hasTriggeredHaptic.current = false;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // If swipe is mostly vertical, ignore it to allow standard scroll
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 10) {
      return;
    }

    // We only care about swiping left (negative deltaX)
    if (deltaX > 0) {
      setSwipeOffset(0);
      currentOffset.current = 0;
      return;
    }

    // Apply damping physics (elastic resistance) past threshold
    let offset = Math.abs(deltaX);
    if (offset > threshold) {
      const excess = offset - threshold;
      // Damping formula: threshold + a logarithmic resistance
      offset = threshold + Math.min(30, excess * 0.25);
    }

    // Trigger light haptic once when entering the delete action zone
    if (offset >= threshold * 0.8 && !hasTriggeredHaptic.current) {
      hapticFeedback.light();
      hasTriggeredHaptic.current = true;
    } else if (offset < threshold * 0.8) {
      hasTriggeredHaptic.current = false;
    }

    setSwipeOffset(-offset);
    currentOffset.current = -offset;
  };

  const onTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    setIsSwiping(false);

    // If swiped past 85% of threshold, snap to fully open threshold, otherwise snap back to 0
    if (Math.abs(currentOffset.current) >= threshold * 0.85) {
      setSwipeOffset(-threshold);
      currentOffset.current = -threshold;
    } else {
      setSwipeOffset(0);
      currentOffset.current = 0;
    }
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
    currentOffset.current = 0;
    hasTriggeredHaptic.current = false;
  };

  return {
    swipeOffset,
    isSwiping,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    resetSwipe,
  };
}
