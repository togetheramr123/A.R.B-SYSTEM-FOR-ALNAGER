"use client";

interface StatusStep {
  key: string;
  label: string;
}
interface StatusBarProps {
  steps: StatusStep[];
  currentStatus: string;
  onStatusClick?: (status: string) => void;
}
export function StatusBar({
  steps,
  currentStatus,
  onStatusClick
}: StatusBarProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStatus);
  return <div className="flex items-center bg-white border-y border-slate-300 rounded-sm overflow-hidden h-[34px]" dir="rtl">
      {" "}
      {steps.map((step, index) => {
      const isActive = index === currentIndex;
      const isClickable = onStatusClick;
      /* Active item: dark slate, inactive: white. */
      const bgColorClass = isActive ? "bg-[#1e293b] text-white font-bold" : "bg-white text-slate-500 hover:bg-slate-50";
      const isFirst = index === 0;
      const isLast = index === steps.length - 1;
      /* RTL chevron pointing left: // Point on Left: (12px 0) -> (0 50%) -> (12px 100%) // Cutout on Right: (100% 0) -> (calc(100% - 12px) 50%) -> (100% 100%) // isFirst (Rightmost) has flat Right edge. // isLast (Leftmost) has flat Left edge. */
      const polyFirst = `polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)`;
      const polyLast = `polygon(0 0, 100% 0, calc(100% - 12px) 50%, 100% 100%, 0 100%)`;
      const polyMid = `polygon(12px 0, 100% 0, calc(100% - 12px) 50%, 100% 100%, 12px 100%, 0 50%)`;
      const clipPath = isFirst ? polyFirst : isLast ? polyLast : polyMid;
      /* Adjust margins so they overlap and interlock */
      const marginLeft = isLast ? "0" : "-12px";
      return <div key={step.key} className="h-full relative" style={{
        marginLeft,
        zIndex: steps.length - index
      }}>
            {" "}
            {/* We add a wrapper with the clip-path to act as the border */}{" "}
            <div className="h-full bg-slate-300 p-[1px]" style={{
          clipPath
        }}>
              {" "}
              <button onClick={() => isClickable && onStatusClick(step.key)} disabled={!isClickable} className={` flex items-center justify-center h-full text-sm transition-colors w-full ${bgColorClass} ${isFirst ? "pr-4 pl-6" : "px-6"} ${isLast ? "pl-4 pr-6" : ""} `} style={{
            clipPath
          }}>
                {" "}
                {step.label}{" "}
              </button>{" "}
            </div>{" "}
          </div>;
    })}{" "}
    </div>;
}