'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, ChevronDown, ArrowRight, ExternalLink, Plus, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { useRouter } from 'next/navigation';
export interface Option {
  value: string;
  label: string;
}
interface OdooComboboxProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  onCreate?: (value: string) => void;
  onQuickCreate?: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  className?: string;
  disabled?: boolean;
  alwaysShowCreate?: boolean;
  searchable?: boolean;
  onSearchMore?: () => void;
  searchMoreUrl?: string;
  createUrl?: string;
  detailUrl?: string;
  onExternalLink?: (value: string) => void;
  maxOptions?: number;
  showWhatsApp?: boolean;
}
export function OdooCombobox({
  options,
  value,
  onChange,
  onCreate,
  onQuickCreate,
  placeholder = "Select...",
  className,
  disabled = false,
  searchable = true,
  alwaysShowCreate = false,
  onSearchMore,
  searchMoreUrl,
  createUrl,
  detailUrl,
  onExternalLink,
  onFocus,
  maxOptions = 20,
  showWhatsApp = false
}: OdooComboboxProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleQuickCreate = () => {
    if (!searchTerm) return;
    setOpen(false);
    if (onQuickCreate) {
      onQuickCreate(searchTerm);
    } else if (onCreate) {
      onCreate(searchTerm);
    }
  };
  const normalizeText = (text: string) => {
    return (text || "")
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
      .toLowerCase();
  };
  const normalizedSearchWords = normalizeText(searchTerm).split(" ").filter(w => w.trim() !== "");
  const selectedOption = options.find(o => o.value === value);
  const isSearchExactMatch = selectedOption && searchTerm === selectedOption.label;
  const filteredOptions = !searchTerm || isSearchExactMatch ? options : options.filter(option => {
    const normalizedLabel = normalizeText(option.label);
    return normalizedSearchWords.every(word => normalizedLabel.includes(word));
  });
  const exactMatchExists = options.some(o => normalizeText(o.label) === normalizeText(searchTerm));
  const showCreateOption = searchTerm && !exactMatchExists && !isSearchExactMatch;
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false); // Restore selected option label when closing without selecting
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, selectedOption]); // Handle Input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!searchable) return;
    setSearchTerm(e.target.value);
    if (!open) setOpen(true);
  };
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setOpen(true);
    onFocus?.(); // Call the passed onFocus prop
  };
  const handleInputBlur = () => {
    // Delay slightly so option clicks (mousedown) can fire first if they click an option
    setTimeout(() => {
      if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
        setOpen(false);
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    }, 150);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow arrow keys to move cursor within the input (don't use them for dropdown nav)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.stopPropagation();
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0].value, filteredOptions[0].label);
    }
  };
  const handleSelect = (optionValue: string, optionLabel: string) => {
    onChange(optionValue);
    setSearchTerm(optionLabel);
    setOpen(false);
  };
  const handleSearchMore = () => {
    setOpen(false);
    if (searchMoreUrl) {
      router.push(searchMoreUrl);
    } else if (onSearchMore) {
      onSearchMore();
    }
  };
  const handleCreateNew = () => {
    setOpen(false);
    if (createUrl) {
      const separator = createUrl.includes('?') ? '&' : '?';
      router.push(`${createUrl}${separator}name=${encodeURIComponent(searchTerm)}`);
    } else if (onCreate) {
      onCreate(searchTerm);
    }
  };
  const [lastValue, setLastValue] = useState(value);
  useEffect(() => {
    const option = options.find(o => o.value === value);
    const expectedLabel = option?.label || "";
    if (value !== lastValue) {
      setLastValue(value);
      setSearchTerm(expectedLabel);
    } else if (value && options.length > 0 && searchTerm !== expectedLabel && !searchTerm) {
      setSearchTerm(expectedLabel);
    }
  }, [value, lastValue, options, searchTerm]);
  const handleInputClick = () => {
    if (!disabled && !open) {
      setOpen(true);
    }
  };

  return <div className={cn("relative w-full", className)} ref={wrapperRef} onFocus={onFocus}> <div className="relative group flex-1 w-full"> <input ref={inputRef} type="text" title={searchTerm} className={cn("w-full bg-transparent py-1 text-right text-[15px] font-bold outline-none transition-all border-b border-transparent hover:border-slate-300 focus:border-slate-800 focus:border-b-2 pr-1", value ? (showWhatsApp ? "pl-14" : "pl-8") : "pl-2", "text-[#714B67] placeholder:text-slate-400 cursor-pointer hover:underline focus:no-underline focus:cursor-text", disabled && "cursor-not-allowed opacity-80 hover:border-transparent focus:border-transparent hover:no-underline cursor-not-allowed")} placeholder={placeholder || 'اختر أو ابحث...'} value={searchTerm} onChange={handleInputChange} onFocus={handleInputFocus} onBlur={handleInputBlur} onClick={handleInputClick} onMouseDown={e => {
          if (document.activeElement === inputRef.current && value) {
            e.preventDefault();
            if (onExternalLink) {
              onExternalLink(value);
            } else if (detailUrl) {
              router.push(`${detailUrl}/${value}`);
            }
          }
        }} onKeyDown={handleKeyDown} readOnly={false} disabled={disabled} autoComplete="new-password" autoCorrect="off" spellCheck="false" /> <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white/80 px-1 py-1 rounded"> {value && (detailUrl || onExternalLink) && <button type="button" onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            if (onExternalLink) {
              onExternalLink(value);
            } else if (detailUrl) {
              router.push(`${detailUrl}/${value}`);
            }
          }} className="flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-slate-100 rounded w-[22px] h-[22px] transition-colors cursor-pointer" title="الانتقال إلى التفاصيل"> <ArrowLeft className="w-3.5 h-3.5 font-bold" /> </button>} {value && showWhatsApp && <button type="button" onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            window.open('https://web.whatsapp.com', '_blank');
          }} className="flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white rounded w-[22px] h-[22px] transition-colors" title="إرسال رسالة واتساب"> <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]"> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /> </svg> </button>} </div> </div> {open && !disabled && <div className="absolute top-full left-0 z-[9999] mt-1 max-h-72 w-full overflow-auto rounded-sm border border-slate-200 bg-white shadow-sm py-1 text-right"> {} {filteredOptions.slice(0, maxOptions).map(option => <div key={option.value} className={cn("cursor-pointer px-4 py-2 text-sm hover:bg-slate-100 flex items-center justify-between group", value === option.value && "bg-blue-50 text-[#2563EB] font-medium")} onClick={e => {
        e.preventDefault();
        handleSelect(option.value, option.label);
      }}> <span>{option.label}</span> {value === option.value && <Check className="h-3 w-3" />} </div>)} {} {filteredOptions.length === 0 && searchTerm && <div className="px-4 py-2 text-sm text-slate-400 text-center"> لا توجد نتائج </div>} {} <div className="border-t border-slate-100 mt-1"> {} {searchTerm && !exactMatchExists && !!onQuickCreate && <div className="px-4 py-2 text-sm text-[#017E84] hover:bg-slate-50 cursor-pointer flex items-center gap-2 font-medium" onMouseDown={e => { e.preventDefault(); }} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          handleQuickCreate();
        }}> <span>إنشاء "{searchTerm}"</span> </div>} {} {(onSearchMore || searchMoreUrl) && <div className="px-4 py-2 text-sm text-[#017E84] hover:bg-slate-50 cursor-pointer flex items-center gap-2 font-medium" onMouseDown={e => { e.preventDefault(); }} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          handleSearchMore();
        }}> <span>البحث عن المزيد...</span> </div>} {} {(showCreateOption || alwaysShowCreate) && (onCreate || createUrl) && <div className="px-4 py-2 text-sm text-[#017E84] hover:bg-slate-50 cursor-pointer flex items-center gap-2 font-medium" onMouseDown={e => { e.preventDefault(); }} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          handleCreateNew();
        }}> <span>{searchTerm && !exactMatchExists ? `إنشاء وتعديل "${searchTerm}"` : 'إنشاء وتحرير...'}</span> </div>} </div> </div>} </div>;
}