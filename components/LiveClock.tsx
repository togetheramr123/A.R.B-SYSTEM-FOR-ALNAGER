"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!time) return null;
  const dateStr = time.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const timeStr = time.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  const hijriDateStr = time.toLocaleDateString("ar-SA-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return <div className="flex items-center gap-2 text-gray-500 select-none">
      {" "}
      <Clock className="w-4 h-4 text-gray-400" />{" "}
      <div className="flex flex-col items-end">
        {" "}
        <span className="text-[11px] font-bold text-gray-700 leading-none">
          {timeStr}
        </span>{" "}
        <span className="text-[10px] text-gray-400 leading-tight mt-0.5">
          {dateStr} - <span className="text-gray-300">{hijriDateStr}</span>
        </span>{" "}
      </div>{" "}
    </div>;
}