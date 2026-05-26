'use client';

import { toast } from 'sonner';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Search, Edit, ExternalLink } from 'lucide-react';
interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
}
interface OdooAutocompleteProps {
  options: Option[];
  value?: string | number;
  onChange: (value: string | number | null, option?: Option) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  onCreateEdit?: (query: string) => void;
  onSearchMore?: () => void;
  disabled?: boolean;
  onLinkClick?: (e: React.MouseEvent, id: string | number) => void;
  showWhatsApp?: boolean;
  onDoubleClick?: () => void; // For opening ProductBrowserModal
  error?: boolean;
  initialQuery?: string;
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
import { Portal } from './Portal';

export function OdooAutocomplete({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label = "Record",
  className = "",
  onCreateEdit,
  onSearchMore,
  disabled = false,
  onLinkClick,
  showWhatsApp = false,
  onDoubleClick,
  error = false,
  initialQuery = "",
  id,
  onKeyDown
}: OdooAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    isFlipped: false
  });

  const isInteractingRef = useRef(false); // Prevent premature close
  const randomNameRef = useRef("");
  if (!randomNameRef.current) {
    randomNameRef.current = `autocomplete-off-${id || 'field'}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Initial value handling
  useEffect(() => {
    const selected = (options || []).find(o => o.id === value);
    if (selected) {
      if (query !== selected.label) {
        setQuery(selected.label);
      }
    } else if (value && !isOpen && initialQuery) {
      if (query !== initialQuery) {
        setQuery(initialQuery);
      }
    } else if (!value && !isOpen) {
      setQuery(initialQuery || '');
    }
  }, [value, options, isOpen, initialQuery]);

  // Update position
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // approximate max height for logic only
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < dropdownHeight && rect.top > spaceBelow;

      const width = Math.max(rect.width, 200);
      // In RTL, we want to align the right edge of the dropdown with the right edge of the input
      // So left = rightEdge - width
      const left = rect.right + window.scrollX - width;

      setCoords({
        top: shouldFlip ? rect.top + window.scrollY : rect.bottom + window.scrollY,
        left: left,
        width: width,
        isFlipped: shouldFlip
      });
    }
  }, []);

  const handleOpen = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  // Close on click outside — improved to not close when interacting with dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isInteractingRef.current) return;
      const target = event.target as HTMLElement;
      const isInDropdown = target.closest('.odoo-autocomplete-dropdown');
      const isInContainer = containerRef.current?.contains(target);

      if (!isInDropdown && !isInContainer) {
        setIsOpen(false);
        const selected = (options || []).find(o => o.id === value);
        if (selected) {
          setQuery(selected.label);
        } else if (!value) {
          setQuery(initialQuery || '');
        }
      }
    };

    // Don't close on scroll inside dropdown — only close on scroll of main page
    const handleScroll = (event: Event) => {
      if (!isOpen) return;
      const target = event.target as HTMLElement;
      if (target && typeof target.closest === 'function') {
        if (target.closest('.odoo-autocomplete-dropdown')) {
          return; // Don't close when scrolling inside dropdown
        }
      }
      
      // Close on ANY scroll outside the dropdown
      setIsOpen(false);
    };
    const handleResize = () => {
      if (isOpen) updatePosition();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [value, options, isOpen, updatePosition]); // Smart search — search in label + subLabel + id
  const filteredOptions = (options || []).filter(opt => {
    if (!query || query.trim() === '') return true; // Show all when empty (first 11);
    const q = (query || "").toString().toLowerCase();
    const label = (opt.label || "").toString().toLowerCase();
    const sub = (opt.subLabel || "").toString().toLowerCase();
    const id = (opt.id || "").toString().toLowerCase();
    return label.includes(q) || sub.includes(q) || id.includes(q);
  }); // Show exactly 11 items
  const displayOptions = filteredOptions.slice(0, 11);
  const handleSelect = (option: Option) => {
    isInteractingRef.current = true;
    onChange(option.id, option);
    setQuery(option.label);
    setIsOpen(false);
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 100);
  };
  const handleCreateEdit = () => {
    if (onCreateEdit) {
      onCreateEdit(query);
      setIsOpen(false);
    } else {
      toast.info(`Create & Edit "${query}" logic...`);
    }
  };
  const safeQuery = (query || "").toString();
  const trimmedQuery = safeQuery.trim().toLowerCase();
  const showCreateEdit = onCreateEdit && trimmedQuery.length > 0 && !(options || []).some(opt => (opt.label || "").toString().toLowerCase() === trimmedQuery);
  return <div ref={containerRef} className={`relative w-full h-full ${className}`}> <div className="relative group flex items-center w-full h-full"> <input ref={inputRef} id={id} name={randomNameRef.current} type="text" autoComplete="new-password" value={query} title={query} onChange={e => {
        const val = e.target.value;
        setQuery(val);
        updatePosition();
        setIsOpen(true);
        if (value) onChange(null);
      }} onKeyDown={onKeyDown} onClick={() => {
        handleOpen();
      }} onFocus={e => {
        e.target.select();
      }} onMouseDown={e => {
        // If already focused, a second click navigates to the item page (Click 2)
        if (document.activeElement === inputRef.current && value && onLinkClick) {
          e.preventDefault();
          onLinkClick(e as any, value);
        }
      }} placeholder={placeholder} disabled={disabled} className={`w-full h-full bg-transparent border-b ${error ? 'border-red-500' : 'border-transparent focus:border-[#017E84]'} outline-none py-1.5 text-[15px] font-bold transition-colors text-[#714B67] placeholder:text-slate-400 cursor-pointer hover:underline focus:no-underline focus:cursor-text ${disabled ? 'opacity-50 cursor-not-allowed' : ''} px-2`} /> <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 px-1 py-1"> {value && showWhatsApp && <button type="button" onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }} className="flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white rounded w-[20px] h-[20px] transition-colors" title="إرسال رسالة واتساب"> <svg viewBox="0 0 24 24" fill="currentColor" className="w-[12px] h-[12px]"> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /> </svg> </button>} </div> </div> {isOpen && <Portal> <div ref={dropdownRef} className="odoo-autocomplete-dropdown absolute z-[9999] bg-white border border-[#ccc] flex flex-col" style={{
        top: coords.top,
        left: coords.left,
        width: coords.width,
        minWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transform: coords.isFlipped ? 'translateY(-100%)' : 'none'
      }} onMouseDown={() => {
        isInteractingRef.current = true;
      }} onMouseUp={() => {
        setTimeout(() => {
          isInteractingRef.current = false;
        }, 50);
      }}> {/* Scrollable items area */} <div className="overflow-y-auto flex-1" style={{
          maxHeight: '340px'
        }}> {/* Filtered List - 11 items max */} {displayOptions.length === 0 ? <div className="px-3 py-4 text-center text-[13px] text-[#888]"> لا توجد نتائج مطابقة </div> : displayOptions.map((opt, idx) => <button type="button" key={opt.id} onMouseDown={e => e.preventDefault()} onClick={() => handleSelect(opt)} className={`w-full text-right px-3 py-[6px] text-[13px] flex flex-col items-start transition-colors ${opt.id === value ? 'bg-[#e8e8e8] text-[#333]' : 'text-[#4c4c4c] hover:bg-[#f0f0f0]'}`}> <span>{opt.label}</span> {opt.subLabel && opt.subLabel.length > 0 && <span className="text-[11px] text-[#999] mt-0.5">{opt.subLabel}</span>} </button>)} </div> {/* Footer — Exact Odoo style */} <div className="border-t border-[#ddd]"> {/* Search More — always visible */} <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => {
            setIsOpen(false);
            if (onSearchMore) onSearchMore();
          }} className="w-full text-right px-3 py-[6px] text-[13px] text-[#43436B] hover:bg-[#f0f0f0] transition-colors"> البحث عن المزيد... </button> {/* Create / Start typing */} {showCreateEdit ? <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => {
            handleCreateEdit();
          }} className="w-full text-right px-3 py-[6px] text-[13px] text-[#43436B] hover:bg-[#f0f0f0] border-t border-[#eee] transition-colors"> إنشاء وتحرير "{query}"... </button> : <button type="button" onMouseDown={e => e.preventDefault()} className="w-full text-right px-3 py-[6px] text-[13px] text-[#999] hover:bg-[#f0f0f0] border-t border-[#eee] transition-colors cursor-default"> ابدأ بالكتابة... </button>} </div> </div> </Portal>} </div>;
}