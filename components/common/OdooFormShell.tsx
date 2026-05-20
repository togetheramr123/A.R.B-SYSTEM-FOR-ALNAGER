"use client";

import React, { ReactNode } from "react";
import OdooStatusBar, { StatusStep } from "./OdooStatusBar";
import { Chatter } from "@/components/chatter/Chatter";
import type { ChatterModel } from "@/app/actions/chatter";
interface ContextAction {
  label: string;
  onClick: () => void;
  style: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}
interface OdooFormShellProps {
  // Status Bar
  statusSteps: StatusStep[];
  currentStatus: string;
  onStatusClick?: (status: string) => void;
  statusClickable?: boolean;
  // Context-sensitive action buttons (shown in statusbar)
  contextActions?: ContextAction[];
  extraHeaderElements?: ReactNode;
  // Smart Buttons
  smartButtons?: ReactNode;
  // Title section
  titleLabel?: string;
  titleValue?: string;
  // Main content
  children: ReactNode;
  // Side Chatter
  chatterId?: string;
  chatterModel?: string;
  // Error banner
  error?: string | null;
  // Loading overlay
  isLoading?: boolean;
  // Audit Tracking
  createdBy?: string | null;
  createdAt?: string | Date | null;
  updatedBy?: string | null;
  updatedAt?: string | Date | null;
} /** * OdooFormShell — The master layout component for all Odoo-style form views. * Provides: StatusBar, Action Buttons, Smart Buttons, Side Chatter, Sheet layout * * Architecture: * ┌────────────────────────────────────────────────────────────────────┐ * │ StatusBar: [Action Buttons] [── Draft ── Sent ── Sale ──]│ * ├────────────────────────────────────────────────────────────────────┤ * │ Smart Buttons: [📄 Invoices: 2] [🚚 Delivery: 1] [💳 Pay: 0] │ * ├───────────────────────────────────┬────────────────────────────────┤ * │ │ │ * │ Sheet Content (Form Fields) │ Side Chatter │ * │ - Title │ - Messages │ * │ - Field Groups (2 columns) │ - Activities │ * │ - Notebook Tabs │ - Followers │ * │ - Order Lines Table │ │ * │ - Totals │ │ * │ │ │ * └───────────────────────────────────┴────────────────────────────────┘ */
export default function OdooFormShell({
  statusSteps,
  currentStatus,
  onStatusClick,
  statusClickable = false,
  contextActions = [],
  smartButtons,
  titleLabel,
  titleValue,
  children,
  chatterId,
  chatterModel,
  error,
  isLoading = false,
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
  extraHeaderElements,
}: OdooFormShellProps) {
  return (
    <div
      className={`o_form_view ${isLoading ? "pointer-events-none opacity-60 transition-opacity duration-200" : ""}`}
    >
      {" "}
      <div className="o_form_view_container">
        {" "}
        {/* Main Content Area */}{" "}
        <div className="o_content_area">
          {" "}
          <div className="o_form_sheet_bg">
            {" "}
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              {" "}
              <div className="o_form_sheet">
                {" "}
                {/* Status Bar */}{" "}
                {(contextActions.length > 0 || statusSteps.length > 0) && (
                  <div className="o_statusbar">
                    {" "}
                    <div className="o_statusbar_buttons">
                      {" "}
                      {contextActions.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          className={
                            action.style === "primary"
                              ? "o_btn_primary"
                              : action.style === "danger"
                                ? "o_btn_primary"
                                : "o_btn_secondary"
                          }
                          style={
                            action.style === "danger"
                              ? {
                                  background: "var(--odoo-danger)",
                                }
                              : undefined
                          }
                          onClick={action.onClick}
                          disabled={action.disabled || action.loading}
                        >
                          {" "}
                          {action.loading ? (
                            <span className="inline-flex items-center gap-1.5">
                              {" "}
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                {" "}
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />{" "}
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />{" "}
                              </svg>{" "}
                              {action.label}{" "}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              {" "}
                              {action.icon} {action.label}{" "}
                            </span>
                          )}{" "}
                        </button>
                      ))}{" "}
                      {extraHeaderElements}{" "}
                    </div>{" "}
                    <OdooStatusBar
                      steps={statusSteps}
                      currentStatus={currentStatus}
                      onStatusClick={onStatusClick}
                      clickable={statusClickable}
                    />{" "}
                  </div>
                )}{" "}
                {/* Error Banner */}{" "}
                {error && (
                  <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-3">
                    {" "}
                    <svg
                      className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />{" "}
                    </svg>{" "}
                    <div>
                      {" "}
                      <p className="text-sm font-bold text-red-800">
                        تعذر الحفظ
                      </p>{" "}
                      <p className="text-sm text-red-600 mt-0.5 whitespace-pre-wrap">
                        {error}
                      </p>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                {/* Smart Buttons */}{" "}
                {smartButtons && (
                  <div className="o_button_box"> {smartButtons} </div>
                )}{" "}
                {/* Title Section */}{" "}
                {(titleLabel || titleValue) && (
                  <div className="o_form_title">
                    {" "}
                    {titleLabel && (
                      <div className="o_title_label">{titleLabel}</div>
                    )}{" "}
                    {titleValue && <h1>{titleValue}</h1>}{" "}
                  </div>
                )}{" "}
                {/* Main Form Content */} {children}{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>{" "}
        {/* Bottom Chatter */}{" "}
        {chatterId && chatterModel && (
          <div className="o_chatter_area">
            {" "}
            <Chatter model={chatterModel as ChatterModel} id={chatterId} />{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
