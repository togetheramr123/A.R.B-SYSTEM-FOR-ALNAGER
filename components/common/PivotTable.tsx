'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Download, Layers, Loader2 } from 'lucide-react';
import { getServerPivotData } from '@/app/actions/reports';
interface PivotTableProps {
  initialData: any[];
  availableFields: {
    key: string;
    label: string;
  }[];
  defaultRowFields?: string[];
  defaultColFields?: string[];
  measureField?: string;
}
export function PivotTable({
  initialData,
  availableFields,
  defaultRowFields = ['salesperson'],
  defaultColFields = ['month'],
  measureField = 'subtotal'
}: PivotTableProps) {
  const [rowFields, setRowFields] = useState<string[]>(defaultRowFields);
  const [colFields, setColFields] = useState<string[]>(defaultColFields);
  const [measure, setMeasure] = useState<string>(measureField);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['root']));
  const [data, setData] = useState<any[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchNewCube = async () => {
      setIsLoading(true);
      try {
        const dims = Array.from(new Set([...rowFields, ...colFields]));
        const result = await getServerPivotData(dims, measure);
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    const isDefault = rowFields.join(',') === defaultRowFields.join(',') && colFields.join(',') === defaultColFields.join(',') && measure === measureField;
    if (!isDefault || data.length === 0) {
      fetchNewCube();
    }
  }, [rowFields, colFields, measure]);
  const toggleRow = (path: string) => {
    const next = new Set(expandedRows);
    if (next.has(path)) next.delete(path);else next.add(path);
    setExpandedRows(next);
  };
  const buildTree = (items: any[], fields: string[], depth = 0, path = 'root'): any => {
    if (depth >= fields.length || items.length === 0) {
      return {
        isLeaf: true,
        items,
        path
      };
    }
    const field = fields[depth];
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const key = String(item[field] || 'غير محدد');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    const children: any[] = [];
    for (const [key, groupItems] of Object.entries(groups)) {
      const nestedTree = buildTree(groupItems, fields, depth + 1, `${path}-${key}`);
      children.push({
        key,
        field,
        path: `${path}-${key}`,
        items: groupItems,
        isLeaf: nestedTree.isLeaf,
        children: nestedTree.children
      });
    }
    return {
      isLeaf: false,
      children,
      path,
      items
    };
  };
  const getColHeaders = (treeNode: any): any[] => {
    if (treeNode.isLeaf) return [treeNode];
    const cols = [];
    for (const child of treeNode.children) {
      const childHeaders = getColHeaders(child);
      cols.push({
        ...child,
        colSpan: childHeaders.length,
        childHeaders
      });
    }
    return cols;
  };
  const getLeaves = (treeNode: any): any[] => {
    if (treeNode.isLeaf) return [treeNode];
    let leaves: any[] = [];
    for (const child of treeNode.children) {
      leaves = leaves.concat(getLeaves(child));
    }
    return leaves;
  };
  const rowTree = useMemo(() => buildTree(data, rowFields), [data, rowFields]);
  const colTree = useMemo(() => buildTree(data, colFields), [data, colFields]);
  const colDepth = colFields.length;
  const colLeaves = useMemo(() => getLeaves(colTree), [colTree]);
  const aggregate = (items: any[]) => {
    return items.reduce((sum, item) => sum + (Number(item[measure]) || 0), 0);
  };
  const renderRowNode = (node: any, depth = 0) => {
    const isExpanded = expandedRows.has(node.path);
    const hasChildren = !node.isLeaf && node.children && node.children.length > 0;
    const rowData = <tr key={node.path} className="border-b border-slate-200 hover:bg-slate-50 transition-colors"> <td className="p-2 border-l border-slate-200 bg-slate-50 relative min-w-[250px]"> <div className="flex items-center" style={{
          paddingRight: `${depth * 20}px`
        }}> {hasChildren ? <button onClick={() => toggleRow(node.path)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 ml-1 bg-white rounded shadow-sm border border-slate-300"> {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} className="rotate-180" />} </button> : <div className="w-6"></div>} <span className={`font-semibold text-sm ${depth === 0 ? 'text-indigo-900' : 'text-slate-700'}`}> {node.key || 'المجموع الكلي'} </span> </div> </td> {} <td className="p-2 border-l border-slate-200 text-center font-bold text-slate-800 bg-slate-100/50"> {aggregate(node.items).toLocaleString(undefined, {
          maximumFractionDigits: 2
        })} </td> {} {colLeaves.map((colLeaf: any) => {
        const colSet = new Set(colLeaf.items);
        const intersection = node.items.filter((i: any) => colSet.has(i));
        const val = aggregate(intersection);
        return <td key={`${node.path}-${colLeaf.path}`} className="p-2 border-l border-slate-200 text-center text-sm text-slate-700"> {val === 0 ? '-' : val.toLocaleString(undefined, {
            maximumFractionDigits: 2
          })} </td>;
      })} </tr>;
    let rows = [rowData];
    if (hasChildren && isExpanded) {
      for (const child of node.children) {
        rows = rows.concat(renderRowNode(child, depth + 1));
      }
    }
    return rows;
  };
  return <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-4 overflow-hidden flex flex-col h-full font-sans"> {} <div className={`flex flex-wrap gap-4 mb-4 items-center bg-slate-50 p-3 rounded border border-slate-200 relative ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}> {isLoading && <div className="absolute top-0 right-0 left-0 bottom-0 bg-white/50 z-10 flex items-center justify-center"> <Loader2 className="w-5 h-5 text-[#017E84] animate-spin" /> </div>} <div className="flex items-center gap-2"> <Layers size={18} className="text-slate-600" /> <span className="font-bold text-sm text-slate-700">المقاييس:</span> <select value={measure} onChange={e => setMeasure(e.target.value)} className="text-sm p-1 border border-slate-300 rounded outline-none focus:border-indigo-500 bg-white"> {availableFields.filter(f => ['subtotal', 'qty', 'discount', 'priceUnit'].includes(f.key)).map(f => <option key={f.key} value={f.key}>{f.label}</option>)} </select> </div> <div className="h-4 w-px bg-slate-300 mx-2"></div> <div className="flex items-center gap-2"> <span className="font-bold text-sm text-slate-700">تجميع الصفوف:</span> <div className="flex gap-1"> {rowFields.map((f, i) => <span key={i} className="text-xs font-semibold bg-[#017E84]/20 text-[#015e63] px-2 py-1 rounded flex items-center gap-1 border border-indigo-200"> {availableFields.find(af => af.key === f)?.label || f} <button onClick={() => setRowFields(rowFields.filter((_, idx) => idx !== i))} className="hover:text-red-500 hover:bg-white rounded-full p-0.5">&times;</button> </span>)} <select onChange={e => {
            if (e.target.value) setRowFields([...rowFields, e.target.value]);
            e.target.value = '';
          }} className="text-xs p-1 border border-dashed border-slate-400 rounded outline-none bg-transparent hover:bg-slate-100 cursor-pointer"> <option value="">+ إضافة</option> {availableFields.filter(f => !rowFields.includes(f.key)).map(f => <option key={f.key} value={f.key}>{f.label}</option>)} </select> </div> </div> <div className="h-4 w-px bg-slate-300 mx-2"></div> <div className="flex items-center gap-2"> <span className="font-bold text-sm text-slate-700">تجميع الأعمدة:</span> <div className="flex gap-1"> {colFields.map((f, i) => <span key={i} className="text-xs font-semibold bg-teal-100 text-teal-800 px-2 py-1 rounded flex items-center gap-1 border border-teal-200"> {availableFields.find(af => af.key === f)?.label || f} <button onClick={() => setColFields(colFields.filter((_, idx) => idx !== i))} className="hover:text-red-500 hover:bg-white rounded-full p-0.5">&times;</button> </span>)} <select onChange={e => {
            if (e.target.value) setColFields([...colFields, e.target.value]);
            e.target.value = '';
          }} className="text-xs p-1 border border-dashed border-slate-400 rounded outline-none bg-transparent hover:bg-slate-100 cursor-pointer"> <option value="">+ إضافة</option> {availableFields.filter(f => !colFields.includes(f.key)).map(f => <option key={f.key} value={f.key}>{f.label}</option>)} </select> </div> </div> <div className="mr-auto"> <button className="text-slate-600 hover:text-indigo-700 bg-white border border-slate-300 p-1.5 rounded shadow-sm transition-colors"> <Download size={16} /> </button> </div> </div> {} <div className={`flex-1 overflow-auto border border-slate-300 rounded relative hide-scrollbar transition-opacity ${isLoading ? 'opacity-50' : ''}`}> {data.length === 0 && !isLoading && <div className="absolute inset-0 flex items-center justify-center text-slate-500">لا توجد بيانات بخصوص هذه الأبعاد</div>} <table className="w-full text-right border-collapse min-w-max"> <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm"> {} <tr> <th className="p-2 border-b border-l border-slate-300 text-sm font-bold text-slate-800 bg-slate-200"> الأبعاد المتداخلة </th> <th className="p-2 border-b border-l border-slate-300 text-sm font-bold text-slate-800 text-center bg-slate-200"> المجموع الكلي </th> {colLeaves.map((leaf: any) => <th key={leaf.path} className="p-2 border-b border-l border-slate-300 text-sm font-bold text-slate-700 text-center"> {leaf.key === 'root' ? 'الكل' : leaf.key} </th>)} </tr> </thead> <tbody> {renderRowNode(rowTree)} </tbody> </table> </div> <style jsx>{` .hide-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } .hide-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .hide-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } .hide-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } `}</style> </div>;
}