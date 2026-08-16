import React from "react";
import { AlertTriangle } from "lucide-react";

export function Stamp({ text = "VERIFIED", tone = "stamp", size = "sm" }) {
  const toneClass = tone === "approved" ? "text-approved border-approved" : tone === "amber" ? "text-amber border-amber" : "text-stamp border-stamp";
  return (
    <span
      className={`inline-flex items-center justify-center font-bold uppercase select-none whitespace-nowrap border-2 rounded font-body ${toneClass} ${size === "sm" ? "text-[9.5px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"}`}
      style={{ transform: "rotate(-2.5deg)", letterSpacing: "0.09em" }}
    >
      {text}
    </span>
  );
}

export function PendingTag({ size = "sm" }) {
  return (
    <span
      className={`inline-flex items-center justify-center uppercase select-none whitespace-nowrap border-[1.5px] border-dashed border-line rounded text-textFaint font-body ${size === "sm" ? "text-[9.5px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"}`}
      style={{ letterSpacing: "0.09em" }}
    >
      Pending
    </span>
  );
}

export function SubmittedTag({ size = "sm" }) {
  return (
    <span
      className={`inline-flex items-center justify-center uppercase select-none whitespace-nowrap border-[1.5px] border-amber rounded text-amber font-body ${size === "sm" ? "text-[9.5px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"}`}
      style={{ letterSpacing: "0.09em" }}
    >
      Submitted
    </span>
  );
}

export function StatusBadge({ status, size = "sm" }) {
  if (status === "verified") return <Stamp text="Verified" tone="approved" size={size} />;
  if (status === "submitted") return <SubmittedTag size={size} />;
  return <PendingTag size={size} />;
}

export function Chip({ children, tone = "default" }) {
  const toneClass = {
    default: "bg-paperDeep text-ink2",
    navy: "bg-[#E4E9F0] text-registrar",
    stamp: "bg-[#F3E2DE] text-stamp",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium font-body ${toneClass}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub, accentClass = "border-l-registrar" }) {
  return (
    <div className={`rounded-sm bg-white px-5 py-4 flex flex-col gap-1 border border-line border-l-[3px] ${accentClass}`}>
      <span className="text-xs uppercase tracking-wider text-textFaint font-body" style={{ letterSpacing: "0.08em" }}>{label}</span>
      <span className="text-3xl font-semibold text-ink font-display">{value}</span>
      {sub && <span className="text-xs text-ink2 font-body">{sub}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-3">
      {Icon && <Icon size={30} className="text-textFaint" />}
      <div className="text-base font-semibold text-ink font-display">{title}</div>
      {body && <div className="text-sm max-w-sm text-ink2 font-body">{body}</div>}
    </div>
  );
}

export function CapBadge({ total, cap }) {
  const ok = total <= cap;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm font-mono ${ok ? "text-approved bg-approvedSoft" : "text-stamp bg-[#F3E2DE]"}`}>
      {total} / {cap} marks
    </span>
  );
}

export function ValidationWarning({ children }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-stamp font-body">
      <AlertTriangle size={13} /> {children}
    </div>
  );
}
