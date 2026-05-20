export function LoadingSkeleton({
  type = 'table'
}: {
  type?: 'table' | 'card' | 'detail';
}) {
  if (type === 'table') {
    return <div className="bg-white rounded-sm border border-slate-200 overflow-hidden animate-pulse"> <div className="p-4 border-b border-slate-100"> <div className="h-10 bg-slate-200 rounded w-1/3"></div> </div> {[...Array(5)].map((_, i) => <div key={i} className="p-6 border-b border-slate-100 flex gap-4"> <div className="h-4 bg-slate-200 rounded flex-1"></div> <div className="h-4 bg-slate-200 rounded w-32"></div> <div className="h-4 bg-slate-200 rounded w-24"></div> </div>)} </div>;
  }
  if (type === 'card') {
    return <div className="bg-white rounded-sm border border-slate-200 p-6 animate-pulse"> <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div> <div className="space-y-3"> <div className="h-4 bg-slate-200 rounded"></div> <div className="h-4 bg-slate-200 rounded w-5/6"></div> <div className="h-4 bg-slate-200 rounded w-4/6"></div> </div> </div>;
  }
  return <div className="space-y-6 animate-pulse"> <div className="h-8 bg-slate-200 rounded w-1/3"></div> <div className="bg-white rounded-sm border border-slate-200 p-8"> <div className="grid grid-cols-2 gap-6"> {[...Array(6)].map((_, i) => <div key={i}> <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div> <div className="h-6 bg-slate-200 rounded"></div> </div>)} </div> </div> </div>;
}