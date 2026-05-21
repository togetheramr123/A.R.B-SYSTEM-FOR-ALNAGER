"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Plus, Trash2, Check, Bell, BellOff, X, GripVertical, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// === Types ===
interface Note {
  id: string;
  content: string;
  sortOrder: number;
  isDone: boolean;
  color: string;
  reminderAt: string | null;
  reminderSent: boolean;
  createdAt: string;
}

// === Floating Sticky Notes Widget ===
export default function FloatingNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [reminderNoteId, setReminderNoteId] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [dueReminders, setDueReminders] = useState<any[]>([]);

  // === Dragging State ===
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // === Window dimensions for initial position ===
  const [dimensions, setDimensions] = useState({ width: 380, height: 520 });

  useEffect(() => {
    // Load saved position from localStorage
    const saved = localStorage.getItem("sticky-notes-position");
    if (saved) {
      setPosition(JSON.parse(saved));
    } else {
      setPosition({ x: window.innerWidth - 420, y: window.innerHeight - 600 });
    }
  }, []);

  // === Fetch Notes ===
  const fetchNotes = useCallback(async () => {
    try {
      const { getUserNotes } = await import("@/app/actions/notes");
      const data = await getUserNotes();
      setNotes(data);
    } catch (e) {
      console.error("Error fetching notes:", e);
    }
  }, []);

  // === Check Due Reminders ===
  const checkReminders = useCallback(async () => {
    try {
      const { checkDueReminders } = await import("@/app/actions/notes");
      const due = await checkDueReminders();
      if (due.length > 0) {
        setDueReminders(due);
        // Show browser notification if permitted
        if (Notification.permission === "granted") {
          due.forEach((n: any) => {
            new Notification("⏰ تذكير — المفكرة", {
              body: n.content,
              icon: "/favicon.ico",
            });
          });
        }
      }
    } catch (e) {
      console.error("Error checking reminders:", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      checkReminders();
    }
  }, [isOpen, fetchNotes, checkReminders]);

  // Check reminders every 60 seconds
  useEffect(() => {
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  // === Drag Handlers ===
  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newX = Math.max(0, Math.min(window.innerWidth - dimensions.width, dragStartRef.current.posX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };
    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem("sticky-notes-position", JSON.stringify(position));
      }
    };
    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, position, dimensions.width]);

  // === Actions ===
  const addNote = async () => {
    if (!newNoteText.trim()) return;
    setLoading(true);
    try {
      const { createNote } = await import("@/app/actions/notes");
      const result = await createNote(newNoteText);
      if ("id" in result) {
        setNewNoteText("");
        fetchNotes();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleDone = async (id: string) => {
    try {
      const { toggleNoteDone } = await import("@/app/actions/notes");
      await toggleNoteDone(id);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isDone: !n.isDone } : n));
    } catch (e) { console.error(e); }
  };

  const removeNote = async (id: string) => {
    try {
      const { deleteNote } = await import("@/app/actions/notes");
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e) { console.error(e); }
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      const { updateNoteContent } = await import("@/app/actions/notes");
      await updateNoteContent(id, editText);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, content: editText } : n));
      setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const saveReminder = async (id: string) => {
    if (!reminderDate) return;
    try {
      const { setNoteReminder } = await import("@/app/actions/notes");
      await setNoteReminder(id, reminderDate);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, reminderAt: reminderDate, reminderSent: false } : n));
      setReminderNoteId(null);
      setReminderDate("");
    } catch (e) { console.error(e); }
  };

  const removeReminder = async (id: string) => {
    try {
      const { setNoteReminder } = await import("@/app/actions/notes");
      await setNoteReminder(id, null);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, reminderAt: null } : n));
      setReminderNoteId(null);
    } catch (e) { console.error(e); }
  };

  const activeNotes = notes.filter(n => !n.isDone);
  const doneNotes = notes.filter(n => n.isDone);

  // === FAB Button (Closed State) ===
  if (!isOpen) {
    return (
      <>
        {/* Due Reminder Popup */}
        {dueReminders.length > 0 && (
          <div className="fixed bottom-24 left-6 z-[9998] bg-amber-50 border border-amber-300 rounded-xl shadow-2xl p-4 max-w-xs animate-in slide-in-from-bottom-4" dir="rtl">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">تذكير!</span>
              <button onClick={() => setDueReminders([])} className="mr-auto text-amber-400 hover:text-amber-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            {dueReminders.map(r => (
              <div key={r.id} className="text-xs text-amber-700 py-1 border-t border-amber-200">{r.content}</div>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 left-6 z-[9999] w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          title="المفكرة الشخصية"
        >
          <StickyNote className="w-7 h-7 text-white drop-shadow-sm group-hover:rotate-12 transition-transform" />
          {notes.filter(n => !n.isDone).length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {notes.filter(n => !n.isDone).length}
            </span>
          )}
        </button>
      </>
    );
  }

  // === Main Notepad Window ===
  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-[9999] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200/80 overflow-hidden select-none",
        isDragging && "cursor-grabbing opacity-95",
        isMinimized ? "w-[300px]" : ""
      )}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 300 : dimensions.width,
        height: isMinimized ? "auto" : dimensions.height,
        maxHeight: "85vh",
      }}
    >
      {/* === Title Bar (Draggable) === */}
      <div
        onMouseDown={onDragStart}
        className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-l from-amber-400 to-yellow-500 cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/70" />
          <StickyNote className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white tracking-wide">المفكرة الشخصية</span>
          <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">
            {activeNotes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center transition-colors">
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="w-6 h-6 rounded hover:bg-red-500/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* === Add Note Input === */}
          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0" dir="rtl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="✏️ أضف ملاحظة جديدة..."
                className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 placeholder-slate-400"
                disabled={loading}
              />
              <button
                onClick={addNote}
                disabled={loading || !newNoteText.trim()}
                className="w-9 h-9 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* === Notes List === */}
          <div className="flex-1 overflow-y-auto custom-scrollbar" dir="rtl">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <StickyNote className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">لا توجد ملاحظات بعد</p>
                <p className="text-xs mt-1">اكتب ملاحظتك الأولى أعلاه ✨</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Active Notes */}
                {activeNotes.map((note, index) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    index={index + 1}
                    editingId={editingId}
                    editText={editText}
                    reminderNoteId={reminderNoteId}
                    reminderDate={reminderDate}
                    onToggle={() => toggleDone(note.id)}
                    onDelete={() => removeNote(note.id)}
                    onStartEdit={() => { setEditingId(note.id); setEditText(note.content); }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => saveEdit(note.id)}
                    onEditTextChange={setEditText}
                    onOpenReminder={() => { setReminderNoteId(note.id); setReminderDate(note.reminderAt ? note.reminderAt.slice(0, 16) : ""); }}
                    onSaveReminder={() => saveReminder(note.id)}
                    onRemoveReminder={() => removeReminder(note.id)}
                    onReminderDateChange={setReminderDate}
                  />
                ))}

                {/* Done Notes Separator */}
                {doneNotes.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] text-slate-400 font-medium">تم إنجازها ({doneNotes.length})</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    </div>
                    {doneNotes.map((note, index) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        index={activeNotes.length + index + 1}
                        editingId={editingId}
                        editText={editText}
                        reminderNoteId={reminderNoteId}
                        reminderDate={reminderDate}
                        onToggle={() => toggleDone(note.id)}
                        onDelete={() => removeNote(note.id)}
                        onStartEdit={() => { setEditingId(note.id); setEditText(note.content); }}
                        onCancelEdit={() => setEditingId(null)}
                        onSaveEdit={() => saveEdit(note.id)}
                        onEditTextChange={setEditText}
                        onOpenReminder={() => {}}
                        onSaveReminder={() => {}}
                        onRemoveReminder={() => {}}
                        onReminderDateChange={() => {}}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* === Footer === */}
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/50 text-center shrink-0">
            <span className="text-[10px] text-slate-400">{notes.length} ملاحظة — {doneNotes.length} مكتملة</span>
          </div>
        </>
      )}
    </div>
  );
}

// === Note Item Component ===
function NoteItem({
  note, index, editingId, editText, reminderNoteId, reminderDate,
  onToggle, onDelete, onStartEdit, onCancelEdit, onSaveEdit, onEditTextChange,
  onOpenReminder, onSaveReminder, onRemoveReminder, onReminderDateChange,
}: {
  note: Note; index: number;
  editingId: string | null; editText: string;
  reminderNoteId: string | null; reminderDate: string;
  onToggle: () => void; onDelete: () => void;
  onStartEdit: () => void; onCancelEdit: () => void;
  onSaveEdit: () => void; onEditTextChange: (v: string) => void;
  onOpenReminder: () => void; onSaveReminder: () => void;
  onRemoveReminder: () => void; onReminderDateChange: (v: string) => void;
}) {
  const isEditing = editingId === note.id;
  const isReminder = reminderNoteId === note.id;

  return (
    <div className={cn(
      "group px-3 py-2 mx-1.5 my-0.5 rounded-lg transition-all hover:bg-slate-50/80",
      note.isDone && "opacity-60"
    )}>
      <div className="flex items-start gap-2.5">
        {/* Number Badge */}
        <span className={cn(
          "mt-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-all",
          note.isDone
            ? "bg-green-100 text-green-600"
            : "bg-amber-100 text-amber-700"
        )}>
          {index}
        </span>

        {/* Checkmark */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
            note.isDone
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 hover:border-amber-400"
          )}
        >
          {note.isDone && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                className="flex-1 text-sm border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
              <button onClick={onSaveEdit} className="text-green-600 hover:text-green-700">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p
              className={cn(
                "text-sm cursor-pointer leading-relaxed",
                note.isDone && "line-through text-slate-400 decoration-slate-400 decoration-2"
              )}
              onDoubleClick={onStartEdit}
              title="انقر مرتين للتعديل"
            >
              {note.content}
            </p>
          )}

          {/* Reminder Badge */}
          {note.reminderAt && !note.isDone && (
            <div className="flex items-center gap-1 mt-1">
              <Bell className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-amber-600 font-medium">
                {new Date(note.reminderAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}

          {/* Reminder Input */}
          {isReminder && (
            <div className="flex items-center gap-1.5 mt-2 bg-amber-50 rounded-lg p-2 border border-amber-200">
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => onReminderDateChange(e.target.value)}
                className="flex-1 text-xs border border-amber-300 rounded px-2 py-1 focus:outline-none"
                dir="ltr"
              />
              <button onClick={onSaveReminder} className="text-green-600 hover:text-green-700" title="حفظ">
                <Check className="w-4 h-4" />
              </button>
              {note.reminderAt && (
                <button onClick={onRemoveReminder} className="text-red-500 hover:text-red-600" title="إلغاء التذكير">
                  <BellOff className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!note.isDone && (
            <button onClick={onOpenReminder} className="w-6 h-6 rounded hover:bg-amber-100 flex items-center justify-center" title="تذكير">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
            </button>
          )}
          <button onClick={onDelete} className="w-6 h-6 rounded hover:bg-red-100 flex items-center justify-center" title="حذف">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
