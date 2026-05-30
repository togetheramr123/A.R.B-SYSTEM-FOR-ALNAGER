export default function Loading() {
  return (
    <div className="min-h-screen w-full relative" dir="rtl">
      {/* Full-page blur/skeleton overlay */}
      <div className="animate-pulse">
        {/* Top bar skeleton */}
        <div className="h-[48px] bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-3 justify-end">
          <div className="w-16 h-6 bg-slate-200 rounded-sm" />
          <div className="w-20 h-6 bg-slate-200 rounded-sm" />
          <div className="w-24 h-6 bg-slate-200 rounded-sm" />
        </div>

        {/* Smart buttons skeleton */}
        <div className="h-[44px] bg-white border-b border-slate-200 flex items-center justify-end px-4 gap-2">
          <div className="w-28 h-8 bg-slate-100 rounded-sm" />
          <div className="w-28 h-8 bg-slate-100 rounded-sm" />
          <div className="w-28 h-8 bg-slate-100 rounded-sm" />
        </div>

        {/* Form body skeleton */}
        <div className="bg-white px-8 pt-6 pb-20 max-w-full">
          {/* Title */}
          <div className="flex gap-4 mb-8 items-start">
            <div className="flex-1">
              <div className="w-20 h-4 bg-slate-100 rounded mb-2" />
              <div className="w-64 h-10 bg-slate-100 rounded" />
            </div>
            <div className="w-24 h-24 bg-slate-100 rounded-lg" />
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {/* Left column */}
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28 h-4 bg-slate-100 rounded" />
                  <div className="flex-1 h-8 bg-slate-50 rounded border border-slate-100" />
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28 h-4 bg-slate-100 rounded" />
                  <div className="flex-1 h-8 bg-slate-50 rounded border border-slate-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Section header */}
          <div className="mt-10 mb-4 pb-2 border-b border-slate-200">
            <div className="w-40 h-5 bg-slate-100 rounded" />
          </div>

          {/* Table skeleton */}
          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-3 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-20 h-4 bg-slate-200 rounded" />
              ))}
            </div>
            {[1, 2, 3].map(row => (
              <div key={row} className="h-10 border-b border-slate-100 flex items-center px-3 gap-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-20 h-3 bg-slate-100 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shimmer overlay effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
