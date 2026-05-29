"use client";

import { useState, useMemo } from "react";
import { X, Search, Plus, Trash2, GripVertical, ChevronDown, Download, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExportField {
  id: string;
  label: string;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableFields: ExportField[];
  defaultSelectedFieldIds?: string[];
  onExport: (format: "csv" | "xlsx", selectedFieldIds: string[]) => void;
  isExporting?: boolean;
}

export function ExportDialog({
  isOpen,
  onClose,
  availableFields,
  defaultSelectedFieldIds = [],
  onExport,
  isExporting = false
}: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [searchQuery, setSearchQuery] = useState("");
  const [importCompatible, setImportCompatible] = useState(false);
  
  // Initialize selected fields based on defaultSelectedFieldIds
  const [selectedFields, setSelectedFields] = useState<ExportField[]>(() => {
    return defaultSelectedFieldIds
      .map(id => availableFields.find(f => f.id === id))
      .filter(Boolean) as ExportField[];
  });

  if (!isOpen) return null;

  const handleAddField = (field: ExportField) => {
    if (!selectedFields.find(f => f.id === field.id)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter(f => f.id !== fieldId));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newFields = [...selectedFields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setSelectedFields(newFields);
    } else if (direction === "down" && index < selectedFields.length - 1) {
      const newFields = [...selectedFields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setSelectedFields(newFields);
    }
  };

  const filteredAvailableFields = availableFields.filter(f => 
    !selectedFields.find(sf => sf.id === f.id) &&
    f.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">تصدير البيانات</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
          
          {/* Top Controls */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">صيغة الملف المصدر:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                    type="radio" 
                    name="format" 
                    checked={format === "xlsx"} 
                    onChange={() => setFormat("xlsx")}
                    className="w-4 h-4 text-[#017E84] focus:ring-[#017E84]"
                  />
                  <span className="text-sm text-gray-700">XLSX</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                    type="radio" 
                    name="format" 
                    checked={format === "csv"} 
                    onChange={() => setFormat("csv")}
                    className="w-4 h-4 text-[#017E84] focus:ring-[#017E84]"
                  />
                  <span className="text-sm text-gray-700">CSV</span>
                </label>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                type="checkbox" 
                checked={importCompatible}
                onChange={(e) => setImportCompatible(e.target.checked)}
                className="w-4 h-4 text-[#017E84] focus:ring-[#017E84] rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-medium">أرغب في استيراد البيانات (التصدير المتوافق مع الاستيراد)</span>
            </label>
          </div>

          {/* Two Columns Layout */}
          <div className="flex-1 grid grid-cols-2 gap-8 min-h-[400px] overflow-hidden">
            
            {/* Left Column: Selected Fields */}
            <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-[15px]">الحقول المراد تصديرها</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>القالب:</span>
                  <div className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-gray-300 hover:border-[#017E84] transition-colors">
                    <span>قالب جديد</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
                {selectedFields.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Download className="w-12 h-12 mb-3 opacity-20" />
                    <p>يرجى اختيار الحقول للتصدير</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedFields.map((field, index) => (
                      <div key={field.id} className="group flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded shadow-sm hover:border-[#017E84] hover:shadow transition-all">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <span className="text-[14px] text-gray-800 font-medium">{field.label}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col mr-2 border-r border-l border-gray-200 px-1">
                            <button onClick={() => moveField(index, "up")} disabled={index === 0} className="text-gray-400 hover:text-[#017E84] disabled:opacity-30">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveField(index, "down")} disabled={index === selectedFields.length - 1} className="text-gray-400 hover:text-[#017E84] disabled:opacity-30">
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button onClick={() => handleRemoveField(field.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="إزالة">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Available Fields */}
            <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-[15px]">الحقول المتاحة</h3>
              </div>
              <div className="p-3 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                    type="text" 
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#017E84] focus:border-[#017E84] transition-shadow"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 bg-white">
                <div className="space-y-1">
                  {filteredAvailableFields.map(field => (
                    <div 
                      key={field.id} 
                      onClick={() => handleAddField(field)}
                      className="group flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#F0F8F8] rounded transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#017E84]" />
                        <span className="text-[14px] text-gray-700 group-hover:text-[#017E84] font-medium">{field.label}</span>
                      </div>
                    </div>
                  ))}
                  {filteredAvailableFields.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      لا يوجد حقول مطابقة للبحث
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded font-medium transition-colors"
          >
            إغلاق
          </button>
          <button 
            onClick={() => onExport(format, selectedFields.map(f => f.id))}
            disabled={selectedFields.length === 0 || isExporting}
            className="flex items-center gap-2 px-8 py-2 bg-[#017E84] hover:bg-[#01686D] text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Upload className="w-4 h-4 animate-bounce" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                تصدير
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
