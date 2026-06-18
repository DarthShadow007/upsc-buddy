import { useEffect, useRef } from "react";

/**
 * useStudyTimer
 * - Starts a timer when the user is logged in
 * - Sends accumulated minutes to the backend every 60 seconds
 * - Also sends on tab close / visibility change
 */
export function useStudyTimer(clerkId: string | undefined) {
  const sessionStartRef = useRef<number>(Date.now());
  const lastSavedRef = useRef<number>(Date.now());

  const saveTime = async (forceMinutes?: number) => {
    if (!clerkId) return;

    const now = Date.now();
    const minutesSinceLastSave = forceMinutes ?? Math.floor((now - lastSavedRef.current) / 60000);

    if (minutesSinceLastSave < 1) return; // nothing to save yet

    lastSavedRef.current = now;

    try {
      await fetch("/api/progress/study-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId, minutes: minutesSinceLastSave }),
        // keepalive ensures this fires even on tab close
        keepalive: true,
      });
    } catch {
      // Silently fail — don't interrupt user experience
    }
  };

  useEffect(() => {
    if (!clerkId) return;

    // Reset session start
    sessionStartRef.current = Date.now();
    lastSavedRef.current = Date.now();

    // Save every 60 seconds silently
    const interval = setInterval(() => {
      saveTime();
    }, 60000);

    // Save when tab becomes hidden (user switches tab or minimizes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const minutes = Math.floor((Date.now() - lastSavedRef.current) / 60000);
        if (minutes >= 1) saveTime(minutes);
      }
    };

    // Save when user closes tab or navigates away
    const handleBeforeUnload = () => {
      const minutes = Math.floor((Date.now() - lastSavedRef.current) / 60000);
      if (minutes >= 1) saveTime(minutes);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Save remaining time on component unmount (logout)
      const minutes = Math.floor((Date.now() - lastSavedRef.current) / 60000);
      if (minutes >= 1) saveTime(minutes);

      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [clerkId]);
}