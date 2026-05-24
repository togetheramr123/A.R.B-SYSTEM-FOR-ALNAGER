"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { getUserNotifications, markNotificationRead } from '@/app/actions/user_notifications';
import { approveNegativeStockByRequestId, rejectNegativeStockByRequestId } from '@/app/actions/sales';
import { getPendingFollowUpsForUser } from '@/app/actions/followup';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { DebtFollowUpActionModal } from './DebtFollowUpActionModal';
export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const previousNotifIds = useRef<Set<string>>(new Set());
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const pathname = usePathname();
  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 15000);
    return () => clearInterval(interval);
  }, []);
  const fetchNotifications = async (silent = false) => {
    try {
      const notifs = await getUserNotifications() || [];
      const visibleNotifs = notifs.filter((n: any) => !n.isRead || (n.type === 'approval_request' && !n.isAcknowledged));
      setNotifications(visibleNotifs);
      
      if (!silent) {
        const unreadNotifs = visibleNotifs.filter((n: any) => !n.isRead);
        const newIncoming = unreadNotifs.filter((n: any) => !previousNotifIds.current.has(n.id));
        newIncoming.forEach((n: any) => {
          toast(<div className="flex flex-col gap-1 rtl"> <strong className="text-sm text-blue-700 font-bold flex items-center gap-2"><Bell className="w-4 h-4" /> إشعار جديد</strong> <span className="text-xs font-bold text-slate-800">{n.title}</span> <span className="text-xs text-slate-600 line-clamp-2">{n.message}</span> </div>, {
            duration: 8000,
            position: 'bottom-right',
            className: 'border-r-4 border-blue-500'
          });
        });
      }
      
      previousNotifIds.current = new Set(visibleNotifs.filter((n: any) => !n.isRead).map((n: any) => n.id));
      
      const pendingFollowUps = await getPendingFollowUpsForUser();
      setFollowUps(pendingFollowUps || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string, title: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n).filter(n => !n.isRead || (n.type === 'approval_request' && !n.isAcknowledged)));
      toast.success(<div className="flex flex-col gap-1 rtl"> <strong className="text-sm font-bold">تم شطب الإشعار</strong> <span className="text-xs">{title}</span> </div>, {
        position: 'bottom-right',
        duration: 4000
      });
      await markNotificationRead(id);
    } catch (e) {
      console.error(e);
      fetchNotifications(true);
    }
  };

  const handleApprove = async (e: React.MouseEvent, id: string, resourceId: string) => {
    e.stopPropagation();
    try {
      const toastId = toast.loading("جاري الموافقة...");
      await approveNegativeStockByRequestId(resourceId);
      toast.dismiss(toastId);
      toast.success("تمت الموافقة بنجاح");
      await markNotificationRead(id);
      fetchNotifications(true);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الموافقة");
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string, resourceId: string) => {
    e.stopPropagation();
    try {
      const toastId = toast.loading("جاري الرفض...");
      await rejectNegativeStockByRequestId(resourceId, rejectReason);
      toast.dismiss(toastId);
      toast.success("تم رفض الطلب بنجاح");
      setRejectingId(null);
      setRejectReason("");
      await markNotificationRead(id);
      fetchNotifications(true);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الرفض");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length + followUps.length;
  return(<> <div className="relative group flex justify-center"> <button onClick={() => setOpen(!open)} className={cn("w-11 h-11 rounded-sm flex items-center justify-center transition-all duration-200 relative", open ? "bg-slate-100 text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")}> <Bell className={cn("w-5 h-5 transition-transform duration-200", open ? "scale-110" : "group-hover:scale-110")} /> {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>} </button> {} {open && <> <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div> <div className="absolute right-14 top-0 w-80 bg-white border border-slate-200 shadow-sm rounded-sm z-50 overflow-hidden rtl animate-in fade-in zoom-in duration-200 origin-top-right"> <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between"> <h3 className="font-bold text-slate-800">الإشعارات</h3> <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} جديد</span> </div> <div className="max-h-96 overflow-y-auto"> {notifications.length === 0 && followUps.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm"> لا توجد إشعارات </div> : <> {followUps.map(fu => <div key={fu.id} className="p-4 border-b border-amber-100 bg-amber-50 hover:bg-amber-100/50 transition-colors cursor-pointer group/item" onClick={() => {
              setSelectedFollowUp(fu);
              setOpen(false);
            }}> <div className="flex justify-between items-start gap-2"> <h4 className="font-bold text-sm text-amber-900 flex items-center gap-1"> <Clock className="w-4 h-4" /> متابعة: {fu.partner.name} </h4> <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0 animate-pulse"></span> </div> <p className="text-xs text-amber-800/80 mt-1 line-clamp-2 leading-relaxed font-medium">حان موعد متابعة مديونية العميل. اضغط للتحديث.</p> </div>)} {notifications.map(notif => <div key={notif.id} className={cn("p-4 border-b border-slate-100 transition-colors relative group/item", !notif.isRead ? "bg-blue-50/50" : "", notif.type !== 'approval_request' ? "cursor-pointer hover:bg-slate-50" : "")} onClick={() => {
              if (notif.type !== 'approval_request') handleMarkRead(notif.id, notif.title);
            }}> <div className="flex justify-between items-start gap-2"> <h4 className="font-bold text-sm text-slate-800">{notif.title}</h4> <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></span> </div> <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{notif.message}</p> 
            {notif.type === 'approval_request' && (
              <div className="mt-3">
                {rejectingId === notif.id ? (
                  <div className="flex flex-col gap-2">
                    <input type="text" autoFocus placeholder="الرجاء كتابة سبب الرفض..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} onClick={e => e.stopPropagation()} className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-red-500" />
                    <div className="flex gap-2">
                      <button onClick={e => handleReject(e, notif.id, notif.resourceId)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded shadow-sm font-bold text-xs flex-1 transition-colors">تأكيد الرفض</button>
                      <button onClick={e => { e.stopPropagation(); setRejectingId(null); setRejectReason(""); }} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded shadow-sm font-bold text-xs transition-colors">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={e => handleApprove(e, notif.id, notif.resourceId)} className="bg-[#017E84] hover:bg-[#01686d] text-white px-3 py-1.5 rounded shadow-sm font-bold text-xs flex-1 transition-colors">موافقة</button>
                    <button onClick={e => { e.stopPropagation(); setRejectingId(notif.id); }} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded shadow-sm font-bold text-xs flex-1 transition-colors">رفض</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50"> <span className="text-[10px] text-slate-400 font-medium"> {new Date(notif.createdAt).toLocaleDateString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} </span> 
                  <div className="flex items-center gap-2">
                    {notif.type === 'approval_request' && <button onClick={e => { e.stopPropagation(); handleMarkRead(notif.id, notif.title); }} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1 py-1 rounded">تجاهل</button>}
                    {notif.linkUrl && <Link href={notif.linkUrl} onClick={() => setOpen(false)} className="text-[10px] text-[#017E84] hover:text-[#015e63] font-bold bg-[#017E84]/10 px-2 py-1 rounded"> عرض </Link>}
                  </div> 
            </div> </div>)} </>} </div> </div> </>} {} {!open && <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"> الإشعارات {unreadCount > 0 && `(${unreadCount})`} <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800" /> </div>} </div> {selectedFollowUp && <DebtFollowUpActionModal open={!!selectedFollowUp} onOpenChange={open => {
    if (!open) setSelectedFollowUp(null);
    fetchNotifications();
  }} followUp={selectedFollowUp} id={selectedFollowUp.id} partner={selectedFollowUp.partner} notes={selectedFollowUp.notes || ''} nextFollowUpDate={selectedFollowUp.nextFollowUpDate || ''} />} </>);
}
