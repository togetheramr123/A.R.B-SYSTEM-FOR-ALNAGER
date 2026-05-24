'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Upload, CheckCircle2, Loader2, AlertCircle, Trash2, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { matchOCRText } from '@/app/actions/ocrMapping';
import Tesseract from 'tesseract.js';
import { OdooCombobox } from '@/components/ui/OdooCombobox';

interface ImageOrderParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmItems: (items: any[]) => void;
  products?: any[];
}

/**
 * A small component that renders a cropped region of an image using a canvas element.
 * This runs entirely client-side after mount.
 */
function CroppedImagePreview({ 
  imageSrc, 
  bbox, 
  index 
}: { 
  imageSrc: string; 
  bbox: { x0: number; y0: number; x1: number; y1: number }; 
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !imageSrc || !bbox) return;

    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pad = 2; // Tighter padding to avoid adjacent lines
      const x = Math.max(0, bbox.x0 - pad);
      const y = Math.max(0, bbox.y0 - pad);
      const w = Math.min(img.width - x, bbox.x1 - bbox.x0 + pad * 2);
      const h = Math.min(img.height - y, bbox.y1 - bbox.y0 + pad * 2);

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc, bbox]);

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        className={`rounded border border-slate-200 bg-white shadow-sm cursor-pointer 
          hover:ring-2 hover:ring-indigo-400 transition-all object-contain
          ${loaded ? '' : 'hidden'}`}
        style={{ maxWidth: '180px', maxHeight: '55px', width: 'auto', height: 'auto' }}
        title="اضغط للتكبير"
        onClick={() => setZoomed(true)}
      />
      {!loaded && (
        <div className="w-[60px] h-[30px] bg-slate-100 rounded animate-pulse flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-slate-300 animate-spin" />
        </div>
      )}
      {/* Zoom icon overlay */}
      {loaded && (
        <div className="absolute top-0 left-0 bg-indigo-600/80 text-white rounded-bl rounded-tr p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3 h-3" />
        </div>
      )}

      {/* Zoomed modal */}
      {zoomed && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setZoomed(false)}
        >
          <div className="bg-white rounded-lg p-4 shadow-2xl max-w-[90vw] max-h-[80vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center w-full">
              <span className="text-sm font-bold text-slate-600">سطر {index + 1} — الصورة المقصوصة</span>
              <button onClick={() => setZoomed(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <ZoomedCanvas imageSrc={imageSrc} bbox={bbox} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Canvas that renders the cropped image at full resolution for the zoom view */
function ZoomedCanvas({ imageSrc, bbox }: { imageSrc: string; bbox: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageSrc || !bbox) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pad = 4; // Tighter padding
      const x = Math.max(0, bbox.x0 - pad);
      const y = Math.max(0, bbox.y0 - pad);
      const w = Math.min(img.width - x, bbox.x1 - bbox.x0 + pad * 2);
      const h = Math.min(img.height - y, bbox.y1 - bbox.y0 + pad * 2);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    };
    img.src = imageSrc;
  }, [imageSrc, bbox]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded border border-slate-200 bg-white"
      style={{ maxWidth: '85vw', maxHeight: '70vh', width: 'auto', height: 'auto' }}
    />
  );
}

export default function ImageOrderParserModal({ isOpen, onClose, onConfirmItems, products }: ImageOrderParserModalProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('processing');
    setProgress(0);

    try {
      // Convert file to data URL for preview
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setImageDataUrl(dataUrl);

      // Run Tesseract OCR (Supporting Arabic and English)
      const worker = await Tesseract.createWorker('ara+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.floor(m.progress * 100));
          }
        }
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();

      const text = data.text;

      if (!text || text.trim() === '') {
        toast.error("لم يتم التعرف على أي نص في الصورة.");
        setStep('upload');
        return;
      }

      // Extract line-level bounding boxes from Tesseract
      const linesBboxes: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] = [];
      
      // Debug: log the Tesseract data structure to understand what's available
      console.log('[OCR DEBUG] data keys:', Object.keys(data));
      console.log('[OCR DEBUG] data.lines exists:', !!data.lines, 'count:', data.lines?.length);
      console.log('[OCR DEBUG] data.blocks exists:', !!data.blocks, 'count:', data.blocks?.length);
      
      if (data.lines && data.lines.length > 0) {
        for (const line of data.lines) {
          if (line.text && line.text.trim()) {
            console.log('[OCR DEBUG] Line:', line.text.trim().substring(0, 40), 'bbox:', JSON.stringify(line.bbox));
            linesBboxes.push({
              text: line.text.trim(),
              bbox: line.bbox
            });
          }
        }
      }
      
      // If no line bboxes found, try to extract from blocks -> paragraphs -> lines
      if (linesBboxes.length === 0 && data.blocks) {
        console.log('[OCR DEBUG] Falling back to blocks->paragraphs->lines');
        for (const block of data.blocks) {
          if (block.paragraphs) {
            for (const para of block.paragraphs) {
              if (para.lines) {
                for (const line of para.lines) {
                  if (line.text && line.text.trim() && line.bbox) {
                    linesBboxes.push({ text: line.text.trim(), bbox: line.bbox });
                  }
                }
              }
            }
          }
        }
        console.log('[OCR DEBUG] Found from blocks:', linesBboxes.length);
      }

      // Get image dimensions for fallback splitting
      let imgWidth = 0;
      let imgHeight = 0;
      try {
        const tempImg = new window.Image();
        await new Promise<void>((resolve) => {
          tempImg.onload = () => { imgWidth = tempImg.width; imgHeight = tempImg.height; resolve(); };
          tempImg.onerror = () => resolve();
          tempImg.src = dataUrl;
        });
      } catch {}

      // Send text to backend for matching
      const matchRes = await matchOCRText(text);
      if (matchRes.success && matchRes.results) {
        const filteredResults = matchRes.results.filter((r: any) => !r.isIgnored);
        
        const rawTextLines = text.split('\n').filter((l: string) => l.trim().length > 0);
        const totalLines = rawTextLines.length;
        
        // Build bbox map: try Tesseract bboxes first, fallback to equal image splits
        const lineBboxMap: Record<number, { x0: number; y0: number; x1: number; y1: number }> = {};
        
        if (linesBboxes.length > 0) {
          // Use Tesseract bboxes
          rawTextLines.forEach((rawLine: string, rawIdx: number) => {
            const rawNorm = rawLine.trim();
            for (const lb of linesBboxes) {
              const tesseractNorm = lb.text.replace(/\s+/g, ' ').trim();
              if (tesseractNorm === rawNorm || tesseractNorm.includes(rawNorm) || rawNorm.includes(tesseractNorm)) {
                lineBboxMap[rawIdx] = lb.bbox;
                break;
              }
            }
            if (!lineBboxMap[rawIdx] && rawIdx < linesBboxes.length) {
              lineBboxMap[rawIdx] = linesBboxes[rawIdx].bbox;
            }
          });
        } else if (imgWidth > 0 && imgHeight > 0 && totalLines > 0) {
          // FALLBACK: divide image into equal horizontal strips
          console.log('[OCR DEBUG] Using equal-strip fallback. Image:', imgWidth, 'x', imgHeight, 'lines:', totalLines);
          const stripHeight = Math.floor(imgHeight / totalLines);
          for (let i = 0; i < totalLines; i++) {
            lineBboxMap[i] = {
              x0: 0,
              y0: i * stripHeight,
              x1: imgWidth,
              y1: (i + 1) * stripHeight
            };
          }
        }
        
        console.log('[OCR DEBUG] lineBboxMap entries:', Object.keys(lineBboxMap).length, 'of', totalLines);

        // Map results using lineIndex from backend
        const mappedResults = filteredResults.map((r: any) => {
          const lineIdx = r.lineIndex;
          const bbox = (lineIdx != null && lineBboxMap[lineIdx]) ? lineBboxMap[lineIdx] : null;

          return {
            ...r,
            selectedProductId: r.suggestedProducts.length === 1 ? r.suggestedProducts[0].id : '',
            selectedProduct: r.suggestedProducts.length === 1 ? r.suggestedProducts[0] : null,
            bbox
          };
        });
        
        const ignoredCount = matchRes.results.filter((r: any) => r.isIgnored).length;
        if (ignoredCount > 0) {
          toast.info(`تم تجاهل ${ignoredCount} أسطر (شخبطة/مهملة) بناءً على تعلم النظام السابق.`);
        }

        setResults(mappedResults);
        setStep('review');
      } else {
        toast.error(`حدث خطأ أثناء معالجة البيانات: ${matchRes.error || 'Unknown error'}`);
        setStep('upload');
      }
    } catch (error: any) {
      console.error(error);
      toast.error("فشل في معالجة الصورة، يرجى المحاولة بصورة أوضح.");
      setStep('upload');
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const newResults = [...results];
    let product = null;

    if (productId === 'IGNORE') {
      product = { id: 'IGNORE', name: 'تجاهل / شخبطة' };
    } else {
      product = newResults[index].suggestedProducts.find((p: any) => p.id === productId);
      if (!product && products) {
        product = products.find((p: any) => p.id === productId);
      }
    }
    
    newResults[index].selectedProductId = productId;
    newResults[index].selectedProduct = product;
    setResults(newResults);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newResults = [...results];
    newResults[index].quantity = qty;
    setResults(newResults);
  };

  const handleDeleteRow = (index: number) => {
    const newResults = [...results];
    newResults.splice(index, 1);
    setResults(newResults);
  };

  const handleConfirm = async () => {
    for (const row of results) {
      if (!row.selectedProductId) continue;
      try {
        const { createOCRRule, updateOCRRule } = await import('@/app/actions/ocrMapping');
        if (row.isManual || row.suggestedProducts.length === 0) {
          await createOCRRule({
            keyword: row.originalText,
            productIds: row.selectedProductId === 'IGNORE' ? 'IGNORE' : row.selectedProductId
          });
        } else if (row.matchedRuleId && !row.suggestedProducts.some((p: any) => p.id === row.selectedProductId)) {
          await updateOCRRule(row.matchedRuleId, {
            keyword: row.matchedKeyword || row.originalText,
            productIds: row.selectedProductId === 'IGNORE' ? 'IGNORE' : row.selectedProductId
          });
        }
      } catch (e) {
        console.error('Failed to save OCR learning', e);
      }
    }

    const validItems = results
      .filter(r => r.selectedProduct && r.selectedProductId !== 'IGNORE')
      .map(r => ({
        product: r.selectedProduct,
        quantity: r.quantity || 1,
        ratio: r.ratio || null,
        uom: r.uom || r.selectedProduct.uom || 'Units',
      }));

    if (validItems.length === 0) {
      toast.error('لم تقم بتحديد أي منتجات صحيحة لإضافتها');
      return;
    }

    onConfirmItems(validItems);
    onClose();
    setTimeout(() => {
      setStep('upload');
      setResults([]);
      setProgress(0);
      setImageDataUrl(null);
      setShowFullImage(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">قراءة الأصناف من صورة (الذكاء الاصطناعي)</h3>
              <p className="text-xs text-slate-500">ارفع صورة فاتورة أو ورقة مكتوبة ليتم تحويلها لأصناف فوراً</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {step === 'upload' && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl bg-white p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors h-64"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">اضغط هنا لرفع صورة</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                يمكنك رفع صورة لفاتورة مطبوعة أو ورقة مكتوبة بخط اليد. النظام سيقوم بقراءة النصوص ومطابقتها بالقاموس.
              </p>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h4 className="font-bold text-slate-800 text-lg mb-2">جاري قراءة الصورة وقص الأسطر...</h4>
              <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-sm text-slate-500 mt-2">{progress}%</p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              {/* Full image preview toggle */}
              {imageDataUrl && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowFullImage(!showFullImage)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      <span>عرض الصورة الأصلية كاملة</span>
                    </div>
                    <span className="text-xs text-slate-400">{showFullImage ? '▲ إخفاء' : '▼ عرض'}</span>
                  </button>
                  {showFullImage && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center">
                      <img src={imageDataUrl} alt="الصورة الأصلية" className="max-h-[70vh] w-full rounded border border-slate-200 shadow-sm object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold mb-1">يرجى المراجعة والاعتماد</p>
                  <p>كل سطر يعرض صورة مقصوصة من الورقة الأصلية بجانب النص المستخرج. اضغط على الصورة لتكبيرها.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-3 px-3 font-bold w-10 text-center border-l border-slate-200">م</th>
                      <th className="py-3 px-3 font-bold w-[200px] text-center">📷 صورة السطر</th>
                      <th className="py-3 px-4 font-bold">النص المستخرج</th>
                      <th className="py-3 px-4 font-bold w-[220px]">المنتج المقترح (اختر)</th>
                      <th className="py-3 px-3 font-bold w-20">الكمية</th>
                      <th className="py-3 px-3 font-bold w-20">الوحدة</th>
                      <th className="py-3 px-2 font-bold w-10 text-center border-r border-slate-200"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400 bg-slate-50 border-l border-slate-100">
                          {index + 1}
                        </td>
                        {/* Cropped image preview */}
                        <td className="py-2 px-3 text-center bg-slate-50/50">
                          {row.bbox && imageDataUrl ? (
                            <CroppedImagePreview 
                              imageSrc={imageDataUrl} 
                              bbox={row.bbox} 
                              index={index} 
                            />
                          ) : (
                            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 py-2">
                              <ImageIcon className="w-3 h-3" />
                              يدوي
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {row.isManual ? (
                            <input 
                              type="text"
                              value={row.originalText}
                              onChange={(e) => {
                                const newResults = [...results];
                                newResults[index].originalText = e.target.value;
                                setResults(newResults);
                              }}
                              placeholder="اكتب النص هنا..."
                              className="w-full border-slate-200 rounded text-sm py-1 px-2 border focus:border-indigo-500 outline-none"
                            />
                          ) : (
                            <>
                              <span className="text-sm font-bold text-indigo-700 block mb-1">
                                {row.originalText}
                                {row.ratio ? <span className="mr-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs">نسبة: {row.ratio}</span> : null}
                              </span>
                              {row.suggestedProducts.length === 0 && (
                                <span className="block text-[10px] text-rose-500 mt-1">غير متعرف عليه بالقاموس</span>
                              )}
                              {row.suggestedProducts.length > 0 && row.selectedProductId && !row.suggestedProducts.some((p: any) => p.id === row.selectedProductId) && (
                                <span className="block text-[10px] text-amber-500 mt-1">تصحيح (سيتم تحديث القاموس)</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <OdooCombobox
                            options={[
                              ...row.suggestedProducts.map((p: any) => ({ value: p.id, label: `⭐ ${p.name}` })),
                              ...(products || [])
                                .filter((p: any) => !row.suggestedProducts.some((sp: any) => sp.id === p.id))
                                .map((p: any) => ({ value: p.id, label: p.label || p.name })),
                              { value: 'IGNORE', label: '🚫 تجاهل / شخبطة' }
                            ]}
                            value={row.selectedProductId || ''}
                            onChange={(val) => handleProductSelect(index, val)}
                            placeholder="ابحث عن الصنف..."
                            className={`w-full text-sm ${!row.selectedProductId ? 'border-rose-300 ring-1 ring-rose-200 rounded' : ''}`}
                            searchable={true}
                            alwaysShowCreate={false}
                          />
                          {row.selectedProductId && row.selectedProductId !== 'IGNORE' && (
                            <div className="text-[10px] mt-1 text-left" dir="ltr">
                              {(() => {
                                const stock = products?.find((p: any) => p.id === row.selectedProductId)?.quantityOnHand || 0;
                                return <span className={stock > 0 ? 'text-green-600' : 'text-rose-500 font-bold'}>الرصيد المتاح: {stock}</span>;
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input 
                            type="number" min="1" value={row.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="w-full border-slate-200 rounded text-sm py-1 px-2 text-center"
                          />
                        </td>
                        <td className="py-3 px-3 text-slate-500">{row.uom}</td>
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <button onClick={() => handleDeleteRow(index)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="حذف السطر">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button 
                onClick={() => setResults([...results, {
                  originalText: '', quantity: 1, uom: 'Units', suggestedProducts: [],
                  selectedProductId: '', selectedProduct: null, isManual: true, bbox: null
                }])}
                className="mt-2 text-indigo-600 text-sm font-bold flex items-center hover:text-indigo-800 transition-colors"
              >
                + إضافة سطر لم يتم قراءته
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
            <button 
              onClick={() => { setStep('upload'); setResults([]); setImageDataUrl(null); setShowFullImage(false); }}
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-sm font-bold hover:bg-slate-50 transition-colors text-sm"
            >
              إلغاء وإعادة الرفع
            </button>
            <button 
              onClick={handleConfirm}
              className="px-6 py-2 bg-indigo-600 text-white rounded-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              اعتماد وإضافة للفاتورة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
