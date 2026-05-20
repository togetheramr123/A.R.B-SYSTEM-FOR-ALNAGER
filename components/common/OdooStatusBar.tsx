'use client';

import React from 'react';
export interface StatusStep {
  value: string;
  label: string;
}
interface OdooStatusBarProps {
  steps: StatusStep[];
  currentStatus: string;
  onStatusClick?: (status: string) => void;
  clickable?: boolean;
}
export default function OdooStatusBar({
  steps,
  currentStatus,
  onStatusClick,
  clickable = false
}: OdooStatusBarProps) {
  const currentIndex = steps.findIndex(s => s.value === currentStatus);
  return <div className="o_statusbar_status"> {steps.map((step, index) => {
      const isCurrent = step.value === currentStatus;
      const isDone = index < currentIndex;
      const isClickable = clickable && onStatusClick;
      let className = 'o_arrow_button';
      if (isCurrent) className += ' o_arrow_button_current';else if (isDone) className += ' o_arrow_button_done';
      if (isClickable) className += ' clickable';
      return <button key={step.value} className={className} onClick={() => isClickable && onStatusClick?.(step.value)} type="button" title={step.label}> {step.label} </button>;
    })} </div>;
}
// compat
export { OdooStatusBar };
export const OdooStatusbar = OdooStatusBar;