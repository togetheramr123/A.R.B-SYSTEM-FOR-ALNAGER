export default function Loading() {
  return (
    <div className="min-h-[80vh] w-full relative" dir="rtl">
      <div className="animate-pulse bg-white px-6 pt-4 pb-20">
        {/* Title area */}
        <div className="flex gap-4 mb-6 items-start">
          <div className="flex-1">
            <div className="w-16 h-3 bg-slate-200 rounded mb-2" />
            <div className="w-48 h-8 bg-slate-200 rounded" />
          </div>
        </div>
        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 mb-8">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 h-3.5 bg-slate-100 rounded" />
              <div className="flex-1 h-8 bg-slate-50 rounded border border-slate-100" />
            </div>
          ))}
        </div>
        {/* Section */}
        <div className="mb-4 pb-2 border-b border-slate-100">
          <div className="w-32 h-4 bg-slate-200 rounded" />
        </div>
        {/* Table */}
        <div className="border border-slate-100 rounded-sm">
          <div className="h-9 bg-slate-50 border-b flex items-center px-3 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="w-16 h-3 bg-slate-200 rounded" />)}
          </div>
          {[1,2,3].map(r => (
            <div key={r} className="h-9 border-b border-slate-50 flex items-center px-3 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="w-16 h-2.5 bg-slate-100 rounded" />)}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.5) 50%,transparent 100%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s ease-in-out infinite'}} />
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}
