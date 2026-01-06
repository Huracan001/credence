"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute

export function AutoRefresh() {
  const router = useRouter();
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(REFRESH_INTERVAL_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
      setTimeUntilRefresh(REFRESH_INTERVAL_MS);
    }, REFRESH_INTERVAL_MS);

    const countdownInterval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        const newTime = prev - 1000;
        return newTime <= 0 ? REFRESH_INTERVAL_MS : newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [router]);

  const minutes = Math.floor(timeUntilRefresh / 60000);
  const seconds = Math.floor((timeUntilRefresh % 60000) / 1000);

  return (
    <div className="flex items-center gap-2 text-xs text-[#6b7280] uppercase tracking-wider">
      <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
      <span>Auto-refresh every 1 minute</span>
      <span className="text-[#00d9ff]">
        ({minutes}:{seconds.toString().padStart(2, "0")})
      </span>
    </div>
  );
}
