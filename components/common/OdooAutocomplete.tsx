'use client';

import { toast } from 'sonner';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, ExternalLink } from 'lucide-react';
import { Portal } from './Portal';

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
  onDoubleClick?: () => void;
  error?: boolean;
  initialQuery?: string;
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function OdooAutocomplete({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  onCreateEdit,
  onSearchMore,
  disabled = false,
  onLinkClick,
  showWhatsApp = false,
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

  const isInteractingRef = useRef(false);

  // A random name ensures Chrome never matches it to previous forms.
  const randomNameRef = useRef("");
  if (!randomNameRef.current) {
    randomNameRef.current = `field_${Math.random().toString(36).substring(2, 10)}`;
  }

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

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < dropdownHeight && rect.top > spaceBelow;

      const width = Math.max(rect.width, 240);
      const left = rect.right + window.scrollX - width;

      setCoords({
        top: shouldFlip ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
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

    const handleScroll = (event: Event) => {
      if (!isOpen) return;
      const target = event.target as HTMLElement;
      if (target && typeof target.closest === 'function') {
        if (target.closest('.odoo-autocomplete-dropdown')) {
          return;
        }
      }
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
  }, [value, options, isOpen, updatePosition, initialQuery]);

  const filteredOptions = (options || []).filter(opt => {
    // If query is exactly the selected value's label, show all options
    // so the user can easily see other options when clicking an already selected field.
    const selected = (options || []).find(o => o.id === value);
    if (!query || query.trim() === '' || (selected && query === selected.label)) {
      return true;
    }
    
    const q = (query || "").toString().toLowerCase();
    const label = (opt.label || "").toString().toLowerCase();
    const sub = (opt.subLabel || "").toString().toLowerCase();
    const optId = (opt.id || "").toString().toLowerCase();
    return label.includes(q) || sub.includes(q) || optId.includes(q);
  });

  const displayOptions = filteredOptions.slice(0, 50); // Show more items for better experience

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
    }
  };

  const safeQuery = (query || "").toString();
  const trimmedQuery = safeQuery.trim().toLowerCase();
  // Show "Create" if: has query, has callback, and no exact label match in options
  const hasExactMatch = (options || []).some(opt => (opt.label || "").toString().trim().toLowerCase() === trimmedQuery);
  const showCreateEdit = onCreateEdit && trimmedQuery.length > 0 && !hasExactMatch;

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Modern input wrapper with glassmorphism and focus effects */}
      <div className={`relative group flex items-center w-full h-full bg-slate-50 hover:bg-slate-100 transition-all duration-200 rounded-md border ${error ? 'border-red-400 focus-within:ring-red-500' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500 focus-within:bg-white focus-within:shadow-sm'} focus-within:ring-1 overflow-hidden px-2.5`}>
        {/* Hidden input to completely fool Chrome autocomplete */}
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" style={{display: 'none'}} />
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="password" style={{display: 'none'}} />
        
        <input
          ref={inputRef}
          id={id}
          name={randomNameRef.current}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="presentation"
          value={query}
          title={query}
          onChange={e => {
            const val = e.target.value;
            setQuery(val);
            updatePosition();
            setIsOpen(true);
            if (value) onChange(null);
          }}
          onKeyDown={onKeyDown}
          onClick={() => {
            handleOpen();
          }}
          onFocus={e => {
            e.target.select();
            handleOpen(); // Open dropdown immediately on focus
          }}
          onMouseDown={e => {
            if (document.activeElement === inputRef.current && value && onLinkClick) {
              e.preventDefault();
              onLinkClick(e as any, value);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-full bg-transparent outline-none py-1.5 text-[14px] font-medium text-slate-800 placeholder-slate-400 transition-colors cursor-pointer hover:underline focus:no-underline focus:cursor-text ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white/60 backdrop-blur-sm px-1 py-0.5 rounded">
          {value && showWhatsApp && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full w-[22px] h-[22px] shadow-sm transition-transform hover:scale-110"
              title="إرسال رسالة واتساب"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[13px] h-[13px]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          )}
          {value && onLinkClick && (
            <button
               type="button"
               onClick={(e) => onLinkClick(e, value)}
               className="text-teal-600 hover:text-teal-800 transition-colors p-1"
               title="عرض التفاصيل"
            >
              <ExternalLink className="w-[14px] h-[14px]" />
            </button>
          )}
        </div>
        
        {/* Dropdown indicator */}
        <div className="flex-shrink-0 text-slate-400 pointer-events-none pr-1">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <Portal>
          <div
            ref={dropdownRef}
            className="odoo-autocomplete-dropdown absolute z-[10000] bg-white flex flex-col rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              minWidth: '240px',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.1)',
              transform: coords.isFlipped ? 'translateY(-100%)' : 'none',
              transformOrigin: coords.isFlipped ? 'bottom right' : 'top right',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
            onMouseDown={() => {
              isInteractingRef.current = true;
            }}
            onMouseUp={() => {
              setTimeout(() => {
                isInteractingRef.current = false;
              }, 50);
            }}
          >
            {/* Scrollable items area */}
            <div className="overflow-y-auto flex-1 p-1.5 custom-scrollbar" style={{ maxHeight: '320px' }}>
              {displayOptions.length > 0 && (
                <div className="space-y-0.5">
                  {displayOptions.map((opt, idx) => (
                    <button
                      type="button"
                      key={opt.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-right px-3 py-2 text-[14px] rounded-lg flex flex-col items-start transition-all duration-150 ${
                        opt.id === value
                          ? 'bg-teal-50/80 text-teal-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.subLabel && opt.subLabel.length > 0 && (
                        <span className={`text-[12px] mt-0.5 ${opt.id === value ? 'text-teal-700/80' : 'text-slate-500'}`}>
                          {opt.subLabel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions Area */}
            <div className="bg-slate-50 border-t border-slate-100 p-1.5 flex flex-col gap-0.5 shadow-[0_-4px_6px_-6px_rgba(0,0,0,0.05)]">
              {/* Search More */}
              {onSearchMore && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIsOpen(false);
                    onSearchMore();
                  }}
                  className="w-full text-right px-3 py-2 text-[13px] font-medium text-teal-700 hover:bg-teal-50 hover:text-teal-800 rounded-md transition-colors flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  البحث عن المزيد...
                </button>
              )}
              
              {/* Create & Edit */}
              {showCreateEdit ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleCreateEdit()}
                  className="w-full text-right px-3 py-2 text-[13px] font-medium text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors flex items-center gap-2"
                >
                  <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full w-4 h-4">
                     <span className="text-xs leading-none">+</span>
                  </span>
                  إنشاء وتحرير "{query}"...
                </button>
              ) : (
                <div className="w-full text-right px-3 py-2 text-[12px] text-slate-400 cursor-default flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  ابدأ بالكتابة للبحث أو الإنشاء...
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}