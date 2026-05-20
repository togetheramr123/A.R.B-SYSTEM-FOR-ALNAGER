'use client';

import { useEffect } from 'react';
export function ArabicNumeralsConverter() {
  useEffect(() => {
    const handleBeforeInput = (e: InputEvent) => {
      if (e.data && /[\u0660-\u0669\u06F0-\u06F9]/.test(e.data)) {
        const target = e.target as HTMLElement;
        if (target && target.dataset && target.dataset.noConvertNum === 'true') return;
        const converted = e.data.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, c => {
          const code = c.charCodeAt(0);
          if (code >= 0x0660 && code <= 0x0669) return String.fromCharCode(code - 0x0660 + 48);
          if (code >= 0x06F0 && code <= 0x06F9) return String.fromCharCode(code - 0x06F0 + 48);
          return c;
        });
        e.preventDefault();
        document.execCommand('insertText', false, converted);
      }
    };
    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text/plain');
      if (pastedText && /[\u0660-\u0669\u06F0-\u06F9]/.test(pastedText)) {
        const target = e.target as HTMLElement;
        if (target && target.dataset && target.dataset.noConvertNum === 'true') return;
        const converted = pastedText.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, c => {
          const code = c.charCodeAt(0);
          if (code >= 0x0660 && code <= 0x0669) return String.fromCharCode(code - 0x0660 + 48);
          if (code >= 0x06F0 && code <= 0x06F9) return String.fromCharCode(code - 0x06F0 + 48);
          return c;
        });
        e.preventDefault();
        document.execCommand('insertText', false, converted);
      }
    };
    document.addEventListener('beforeinput', handleBeforeInput as EventListener);
    document.addEventListener('paste', handlePaste as EventListener);
    return () => {
      document.removeEventListener('beforeinput', handleBeforeInput as EventListener);
      document.removeEventListener('paste', handlePaste as EventListener);
    };
  }, []);
  return null;
}