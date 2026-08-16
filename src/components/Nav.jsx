import React from "react";
import {
  ShieldCheck, UserCheck, ClipboardList, BookOpen, ClipboardCheck,
  PieChart as PieChartIcon, LogOut,
} from "lucide-react";

export function Sidebar({ page, setPage, isLead, isAdmin, user, onSignOut }) {
  const items = [
    { key: "mine", label: "My Sections", icon: UserCheck, show: true },
    { key: "lead", label: "Courses I Lead", icon: ClipboardList, show: isLead || isAdmin },
    { key: "directory", label: "Directory", icon: BookOpen, show: true },
    { key: "tracking", label: "CIE Tracking", icon: ClipboardCheck, show: true },
    { key: "analysis", label: "Component Analysis", icon: PieChartIcon, show: true },
  ];

  return (
    <div className="hidden md:flex flex-col w-60 shrink-0 h-full bg-ink">
      <div className="px-5 pt-6 pb-5 border-b border-[#2A3F5C]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-stampSoft" />
          <span className="text-white text-sm font-semibold tracking-wide font-display">CIE Registrar</span>
        </div>
        <div className="text-xs mt-1 text-[#7C8FAC]">SoCSE · Odd Sem 2026-27</div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.filter((i) => i.show).map((item) => {
          const active = page === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-left transition-colors border-l-[3px] ${
                active ? "bg-[#22385A] text-white font-semibold border-stampSoft" : "text-[#9FB0C7] border-transparent"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#2A3F5C]">
        <div className="text-xs text-white truncate">{user.displayName || user.email}</div>
        <div className="text-xs text-[#7C8FAC] truncate">{user.email}{isAdmin ? " · Admin" : ""}</div>
        <button onClick={onSignOut} className="mt-2 flex items-center gap-1.5 text-xs text-[#9FB0C7] hover:text-white">
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  );
}

export function MobileNav({ page, setPage, isLead, isAdmin }) {
  const items = [
    { key: "mine", label: "Mine", icon: UserCheck, show: true },
    { key: "lead", label: "Lead", icon: ClipboardList, show: isLead || isAdmin },
    { key: "directory", label: "Directory", icon: BookOpen, show: true },
    { key: "tracking", label: "Tracking", icon: ClipboardCheck, show: true },
    { key: "analysis", label: "Analysis", icon: PieChartIcon, show: true },
  ];
  return (
    <div className="md:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto bg-ink">
      {items.filter((i) => i.show).map((item) => {
        const Icon = item.icon;
        const active = page === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs shrink-0 ${active ? "bg-[#22385A] text-white" : "text-[#9FB0C7]"}`}
          >
            <Icon size={13} /> {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TopBar({ title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between px-6 sm:px-8 py-5 shrink-0 border-b border-line">
      <div>
        <h1 className="text-2xl font-semibold text-ink font-display">{title}</h1>
        {subtitle && <p className="text-sm mt-0.5 text-ink2 font-body">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
