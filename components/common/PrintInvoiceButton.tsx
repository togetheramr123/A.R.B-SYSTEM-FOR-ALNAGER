'use client';

import { Printer, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PrintInvoiceButtonProps {
  invoiceId: string;
  locale: string;
  type?: 'invoice' | 'bill' | 'payment';
}

export function PrintInvoiceButton({ invoiceId, locale, type = 'invoice' }: PrintInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Open print page in hidden iframe and trigger print
      const printPath = type === 'bill' 
        ? `/${locale}/accounting/bills/${invoiceId}/print`
        : type === 'payment'
        ? `/${locale}/accounting/payments/${invoiceId}/print`
        : `/${locale}/accounting/invoices/${invoiceId}/print`;
      
      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.src = printPath;
      
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
          } catch (e) {
            // Fallback: open in new tab
            window.open(printPath, '_blank');
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
            setLoading(false);
          }, 1000);
        }, 500);
      };

      // Fallback timeout
      setTimeout(() => {
        if (loading) {
          setLoading(false);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Print error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Printer className="w-4 h-4" />
      )}
      {loading ? 'جاري التحضير...' : 'طباعة'}
    </button>
  );
}
