"use client";

import React from "react";

/**
 * FormLoadingOverlay — يظهر طبقة مموّهة (blur + shimmer) فوق الفورم
 * حتى تكتمل تحميل البيانات الأساسية.
 * 
 * Usage:
 *   <FormLoadingOverlay isLoading={!isReady}>
 *     <YourFormContent />
 *   </FormLoadingOverlay>
 */
export function FormLoadingOverlay({ 
  isLoading, 
  children 
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" dir="rtl">
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
          
          {/* Loading indicator */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-[3px] border-slate-200" />
              <div className="absolute inset-0 w-10 h-10 rounded-full border-[3px] border-transparent border-t-[#017E84] animate-spin" />
            </div>
            <span className="text-sm font-medium text-slate-500 animate-pulse">
              جاري تحميل البيانات...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
