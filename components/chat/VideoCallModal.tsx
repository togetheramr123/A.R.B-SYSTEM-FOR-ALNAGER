'use client';

import React, { useState } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';

interface VideoCallModalProps {
  roomName: string;
  userName: string;
  onClose: () => void;
}

export default function VideoCallModal({
  roomName,
  userName,
  onClose
}: VideoCallModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Constructing a robust URL for Jitsi that hides their branding as much as possible
  // and disables the prejoin page.
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName="${encodeURIComponent(userName)}"&config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false&interfaceConfig.DEFAULT_BACKGROUND="#0f172a"`;

  return (
    <div className={`fixed z-[99999] bg-slate-900 rounded-sm shadow-sm overflow-hidden border border-slate-700 transition-all duration-300 ${isMinimized ? 'bottom-6 right-24 w-[300px] h-[200px]' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] max-w-6xl'}`} dir="ltr">
      <div className="bg-slate-800 text-white p-2 flex justify-between items-center cursor-move" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-200">
            {isMinimized ? 'مكالمة جارية...' : `مكالمة آمنة: ${roomName}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-slate-700 p-1 rounded transition-colors" title={isMinimized ? 'تكبير' : 'تصغير'}>
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="hover:bg-rose-600 p-1 rounded transition-colors text-rose-400 hover:text-white" title="إنهاء وإغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="w-full h-[calc(100%-40px)] bg-slate-900 relative">
         <iframe 
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-none"
         />
      </div>
    </div>
  );
}