"use client";
import React from "react";

import { useCallback, useRef, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTabStore, Tab } from "@/store/tabStore";
import { X, ChevronLeft, ChevronRight, Pin } from "lucide-react";
import { cn } from "@/lib/utils"; /** * TaskBar — Browser-like tab bar for the entire ERP system. * Shows all open pages as tabs. Users can click to navigate, * close tabs with ×, and the active tab is highlighted. */
export function TaskBar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    tabs,
    activeTabId,
    removeTab,
    setActiveTab
  } = useTabStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null); // Check scroll overflow
  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollLeft(el.scrollLeft > 5);
    setShowScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);
  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons);
      const resizeObs = new ResizeObserver(updateScrollButtons);
      resizeObs.observe(el);
      return () => {
        el.removeEventListener("scroll", updateScrollButtons);
        resizeObs.disconnect();
      };
    }
  }, [updateScrollButtons, tabs.length]); // Close context menu on click outside
  useEffect(() => {
    if (contextMenu) {
      const handler = () => setContextMenu(null);
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [contextMenu]);
  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id);
    router.push(tab.path);
  };
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const state = useTabStore.getState();
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab || tab.pinned) return; // Find next tab to navigate to
    const closedIndex = state.tabs.findIndex(t => t.id === tabId);
    const remainingTabs = state.tabs.filter(t => t.id !== tabId);
    removeTab(tabId); // If closing active tab, navigate to next available
    if (state.activeTabId === tabId && remainingTabs.length > 0) {
      const newIndex = Math.min(closedIndex, remainingTabs.length - 1);
      const nextTab = remainingTabs[newIndex] || remainingTabs[0];
      if (nextTab) {
        router.push(nextTab.path);
      }
    }
  };
  const handleMiddleClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      // Middle click e.preventDefault(); handleTabClose(e, tabId);
    }
  };
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId
    });
  };
  const scrollTabs = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }; // Scroll active tab into view when it changes
  useEffect(() => {
    if (!activeTabId || !scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [activeTabId]);
  if (tabs.length === 0) return null;
  return <>
      {" "}
      <div className="bg-[#f8f9fa] border-b border-gray-200 flex items-center h-[38px] relative select-none shrink-0 z-20" dir="rtl">
        {" "}
        {/* Scroll Right Button (RTL) */}{" "}
        {showScrollLeft && <button onClick={() => scrollTabs("left")} className="absolute left-0 top-0 h-full w-7 bg-gradient-to-r from-transparent to-[#f8f9fa] z-10 flex items-center justify-center hover:bg-gray-200/80 transition-colors">
            {" "}
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />{" "}
          </button>}{" "}
        {/* Tabs Container */}{" "}
        <div ref={scrollRef} className="flex items-end h-full overflow-x-auto scrollbar-none flex-1 px-1 gap-[1px]" style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}>
          {" "}
          {tabs.map(tab => {
          const isActive = tab.path.split("?")[0] === pathname?.split("?")[0];
          return <button key={tab.id} data-tab-id={tab.id} onClick={() => handleTabClick(tab)} onMouseDown={e => handleMiddleClick(e, tab.id)} onContextMenu={e => handleContextMenu(e, tab.id)} className={cn("group flex items-center gap-1.5 px-3 h-[34px] rounded-t-md text-[12px] font-medium transition-all duration-150 whitespace-nowrap max-w-[200px] min-w-[80px] relative", isActive ? "bg-white text-gray-900 border-t-2 border-t-[#017E84] border-x border-x-gray-200 border-b-0 shadow-sm font-bold" : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 border-t-2 border-transparent")} title={tab.title}>
                {" "}
                {/* Tab Icon */}{" "}
                <span className="text-[13px] flex-shrink-0">{tab.icon}</span>{" "}
                {/* Tab Title */}{" "}
                <span className="truncate flex-1 text-right">{tab.title}</span>{" "}
                {/* Pin indicator or Close button */}{" "}
                {tab.pinned ? <Pin className="w-2.5 h-2.5 text-gray-300 flex-shrink-0 rotate-45" /> : <span onClick={e => handleTabClose(e, tab.id)} className={cn("w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 transition-all", isActive ? "text-gray-400 hover:text-gray-700 hover:bg-gray-200" : "text-transparent group-hover:text-gray-400 hover:!text-gray-700 hover:!bg-gray-200")}>
                    {" "}
                    <X className="w-3 h-3" />{" "}
                  </span>}{" "}
              </button>;
        })}{" "}
        </div>{" "}
        {/* Scroll Left Button (RTL) */}{" "}
        {showScrollRight && <button onClick={() => scrollTabs("right")} className="absolute right-0 top-0 h-full w-7 bg-gradient-to-l from-transparent to-[#f8f9fa] z-10 flex items-center justify-center hover:bg-gray-200/80 transition-colors">
            {" "}
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />{" "}
          </button>}{" "}
      </div>{" "}
      {/* Context Menu */}{" "}
      {contextMenu && <div className="fixed z-[999] bg-white rounded-lg shadow-sm border border-gray-200 py-1 min-w-[160px] text-[12px]" style={{
      top: contextMenu.y,
      left: contextMenu.x
    }}>
          {" "}
          <button onClick={() => {
        const tab = tabs.find(t => t.id === contextMenu.tabId);
        if (tab && !tab.pinned) handleTabClose({
          stopPropagation: () => {}
        } as any, contextMenu.tabId);
        setContextMenu(null);
      }} className="w-full text-right px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2" disabled={tabs.find(t => t.id === contextMenu.tabId)?.pinned}>
            {" "}
            <X className="w-3.5 h-3.5" /> إغلاق التاب{" "}
          </button>{" "}
          <button onClick={() => {
        useTabStore.getState().closeOtherTabs(contextMenu.tabId);
        setContextMenu(null);
      }} className="w-full text-right px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2">
            {" "}
            <X className="w-3.5 h-3.5" /> إغلاق باقي التابات{" "}
          </button>{" "}
          <div className="border-t border-gray-100 my-1" />{" "}
          <button onClick={() => {
        useTabStore.getState().closeAllTabs();
        setContextMenu(null);
        router.push(tabs.find(t => t.pinned)?.path || `/${pathname?.split("/")[1]}/dashboard`);
      }} className="w-full text-right px-4 py-2 hover:bg-gray-100 transition-colors text-red-600 flex items-center gap-2">
            {" "}
            <X className="w-3.5 h-3.5" /> إغلاق الكل{" "}
          </button>{" "}
        </div>}{" "}
    </>;
}