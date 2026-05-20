"use client";
import React from "react";

import { useShiftTimer } from "@/hooks/useShiftTimer"; /** * ShiftTimerProvider — Should be placed inside the root layout. * It silently runs the 9-hour shift timer in the background. * Shows a warning toast 5 minutes before auto-logout. */
export function ShiftTimerProvider({
  children,
  role
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const disableTimer = role === 'ADMIN' || role === 'MANAGER';
  useShiftTimer(disableTimer);
  return <>{children}</>;
}