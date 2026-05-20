import React, { useState } from "react";
import { Check, CheckCheck, Video, Smile, FileText, Download } from "lucide-react";
import { addReaction } from "@/app/actions/chat";
import Image from "next/image";

export default function MessageBubble({
  msg,
  isMe,
  currentUserId,
  setActiveMeetingRoom,
}: {
  msg: any;
  isMe: boolean;
  currentUserId: string;
  setActiveMeetingRoom: (roomName: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);

  const isMeetingInvite = msg.content?.startsWith("[MEETING_INVITE]");
  const roomName = isMeetingInvite ? msg.content.replace("[MEETING_INVITE]", "") : "";

  const handleReaction = async (emoji: string) => {
    setShowReactions(false);
    await addReaction(msg.id, emoji);
  };

  const renderAttachment = () => {
    if (!msg.attachmentUrl) return null;
    
    if (msg.attachmentType === "image") {
      return (
        <div className="mt-2 relative rounded overflow-hidden max-w-[200px]">
          <img src={msg.attachmentUrl} alt="attachment" className="w-full h-auto object-cover" />
        </div>
      );
    }
    
    if (msg.attachmentType === "audio") {
      return (
        <div className="mt-2 w-[220px]">
          <audio controls className="w-full h-8" src={msg.attachmentUrl} />
        </div>
      );
    }

    return (
      <a href={msg.attachmentUrl} target="_blank" download className="mt-2 flex items-center gap-2 bg-black/10 p-2 rounded-sm hover:bg-black/20 transition-colors">
        <FileText className="w-4 h-4" />
        <span className="text-xs truncate max-w-[120px]">{msg.fileName || "ملف مرفق"}</span>
        <Download className="w-3 h-3 ms-auto" />
      </a>
    );
  };

  return (
    <div
      className={`flex flex-col relative group ${isMe ? "items-end" : "items-start"}`}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className={`flex items-end gap-1`}>
        {/* Reactions Button */}
        {!isMe && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showReactions && (
              <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 bg-white border border-slate-200 shadow-lg rounded-full flex gap-1 p-1 z-[9999] w-max">
                {["👍", "❤️", "😂", "🎉", "🔥"].map(emoji => (
                  <button key={emoji} onClick={() => handleReaction(emoji)} className="hover:scale-125 transition-transform text-lg">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={`max-w-[250px] p-3 rounded-sm text-sm ${
            isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {/* Sender Name in Groups */}
          {!isMe && msg.sender?.name && (
            <div className="text-[10px] font-bold text-blue-600 mb-1">{msg.sender.name}</div>
          )}

          {isMeetingInvite ? (
            <div className="flex flex-col items-center gap-2 text-center p-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-1">
                <Video className="w-5 h-5" />
              </div>
              <p className="font-bold text-xs">
                {isMe ? "قمت بدعوته لاجتماع فيديو" : "دعاك لاجتماع فيديو"}
              </p>
              <button
                onClick={() => setActiveMeetingRoom(roomName)}
                className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-transform active:scale-95 ${
                  isMe ? "bg-white text-blue-600 hover:bg-slate-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                انضمام للاجتماع
              </button>
            </div>
          ) : (
            msg.content
          )}

          {renderAttachment()}
        </div>

        {/* Reactions Button (My messages) */}
        {isMe && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showReactions && (
              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 bg-white border border-slate-200 shadow-lg rounded-full flex gap-1 p-1 z-[9999] w-max">
                {["👍", "❤️", "😂", "🎉", "🔥"].map(emoji => (
                  <button key={emoji} onClick={() => handleReaction(emoji)} className="hover:scale-125 transition-transform text-lg">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Reactions */}
      {msg.reactions && msg.reactions.length > 0 && (
        <div className={`flex gap-1 -mt-2 z-10 ${isMe ? "me-2" : "ms-2"}`}>
          {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).map((emoji: any) => {
            const count = msg.reactions.filter((r: any) => r.emoji === emoji).length;
            return (
              <div key={emoji} className="bg-white border border-slate-200 shadow-sm rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1">
                <span>{emoji}</span>
                {count > 1 && <span className="text-slate-500">{count}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Timestamp & Read state */}
      <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
        <span className="text-[9px] text-slate-400">
          {new Date(msg.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
        </span>
        {isMe && (msg.isRead ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Check className="w-3 h-3 text-slate-300" />)}
      </div>
    </div>
  );
}
