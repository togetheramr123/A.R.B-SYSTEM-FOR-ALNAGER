'use client';

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * Generate PDF from the system's print page using a hidden iframe.
 * This captures the exact same print template the system uses.
 * 
 * Flow:
 * 1. Open the system's print page in a hidden iframe
 * 2. Wait for it to load fully
 * 3. Use html2canvas to capture it
 * 4. Convert to PDF using jsPDF
 * 5. Share via WhatsApp (navigator.share on mobile, download + wa.me on desktop)
 */

export async function generatePdfFromPrintPage(printUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        // Create hidden iframe to load the print page
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        iframe.style.border = 'none';
        iframe.style.zIndex = '-1';
        
        document.body.appendChild(iframe);
        
        iframe.onload = async () => {
            try {
                // Wait a bit for styles/fonts to load
                await new Promise(res => setTimeout(res, 1500));
                
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) throw new Error('Cannot access iframe content');
                
                // Find the main print content (skip control buttons)
                const printContent = iframeDoc.querySelector('.max-w-\\[21cm\\]') || 
                                     iframeDoc.querySelector('[dir="rtl"]') || 
                                     iframeDoc.body;
                
                const canvas = await html2canvas(printContent as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794, // A4 width in px at 96dpi
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = pdfWidth / imgWidth;
                const scaledHeight = imgHeight * ratio;
                
                // Handle multi-page
                let heightLeft = scaledHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
                heightLeft -= pdfHeight;
                
                while (heightLeft > 0) {
                    position = position - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
                    heightLeft -= pdfHeight;
                }
                
                // Cleanup
                document.body.removeChild(iframe);
                
                resolve(pdf.output('blob'));
            } catch (err) {
                document.body.removeChild(iframe);
                reject(err);
            }
        };
        
        iframe.onerror = () => {
            document.body.removeChild(iframe);
            reject(new Error('Failed to load print page'));
        };
        
        iframe.src = printUrl;
    });
}

// Legacy fallback: generate from a DOM element
export async function generatePdfBlob(elementId: string): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Print element not found');

    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '210mm';
    element.style.display = 'block';
    element.style.zIndex = '-1';

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
    });

    element.style.display = 'none';
    element.style.position = '';
    element.style.left = '';

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = pdfWidth / canvas.width;
    const scaledHeight = canvas.height * ratio;

    let heightLeft = scaledHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
}

export function cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
}

export async function shareViaWhatsApp(options: {
    phone: string;
    pdfBlob: Blob;
    fileName: string;
    greeting?: string;
}) {
    const { phone, pdfBlob, fileName, greeting = 'السلام عليكم ورحمة الله' } = options;
    const cleanPhone = cleanPhoneNumber(phone);

    if (!cleanPhone) {
        toast.error('لا يوجد رقم هاتف مسجل لهذا العميل/المورد');
        return;
    }

    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Try Web Share API first (works on mobile WhatsApp)
    if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        try {
            await navigator.share({
                title: fileName,
                text: greeting,
                files: [pdfFile],
            });
            return;
        } catch (err: any) {
            if (err.name === 'AbortError') return;
        }
    }

    // Fallback: Download PDF + Open WhatsApp Web
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting + '\n\n📎 مرفق: ' + fileName)}`;
    
    setTimeout(() => {
        window.open(waUrl, '_blank');
    }, 500);
}
