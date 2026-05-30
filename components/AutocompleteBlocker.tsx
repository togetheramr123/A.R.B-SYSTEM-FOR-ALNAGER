'use client';

import { useEffect } from 'react';

/**
 * مكون عام يعطّل اقتراحات المتصفح (autocomplete) على كل خانات الإدخال
 * يتم تحميله مرة واحدة في الـ layout الرئيسي
 * يستخدم MutationObserver لالتقاط أي input جديد يضاف ديناميكياً
 */
export function AutocompleteBlocker() {
  useEffect(() => {
    const disableAutocomplete = (el: HTMLInputElement) => {
      // Don't touch password fields (they handle their own autocomplete)
      if (el.type === 'password') return;
      // Don't touch hidden/file/submit/checkbox/radio
      if (['hidden', 'file', 'submit', 'checkbox', 'radio', 'color', 'range'].includes(el.type)) return;
      // Only set if not already explicitly set by the developer
      if (!el.getAttribute('autocomplete')) {
        el.setAttribute('autocomplete', 'off');
      }
      if (!el.getAttribute('autocorrect')) {
        el.setAttribute('autocorrect', 'off');
      }
      if (!el.getAttribute('spellcheck')) {
        el.setAttribute('spellcheck', 'false');
      }
      // Chrome ignores autocomplete="off" in some cases, use a random name
      if (!el.getAttribute('data-ac-blocked')) {
        el.setAttribute('data-ac-blocked', 'true');
        el.setAttribute('autocomplete', 'one-time-code');
      }
    };

    // Process all existing inputs
    document.querySelectorAll<HTMLInputElement>('input').forEach(disableAutocomplete);

    // Watch for dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLInputElement) {
            disableAutocomplete(node);
          }
          if (node instanceof HTMLElement) {
            node.querySelectorAll<HTMLInputElement>('input').forEach(disableAutocomplete);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
