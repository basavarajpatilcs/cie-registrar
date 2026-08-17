import React, { useMemo, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import { EmptyState, Stamp, PendingTag } from "../components/ui";
import { PROGRAMME_ORDER, semSortKey } from "../lib/constants";

const BAND_COLORS = [
  "bg-[#F6E4D8]", "bg-[#DCE8DA]", "bg-[#E9DCE4]", "bg-[#DCE3EE]",
  "bg-[#E6DEEE]", "bg-[#F1EAC9]", "bg-[#F0DCD6]", "bg-[#D6E7E6]",
];
const BAND_TEXT = [
  "text-[#8A4A26]", "text-[#3D6B4F]", "text-[#7A3F5C]", "text-[#2C4A73]",
  "text-[#5B4587]", "text-[#8A731F]", "text-[#A23B2E]", "text-[#2E6F6A]",
];

function StageChip({ status, stage }) {
  const cls =
    status === "verified" ? "bg-approved" :
    status === "submitted" ? "bg-amber" : "bg-white border border-line";
  return (
    <span
      title={`CIE-${stage} — ${status}`}
      className={`inline-block w-3.5 h-3.5 rounded-[2px] ${cls}`}
    />
  );
}

function Select({ value, onChange, options, allLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-sm px-2.5 py-1.5 text-sm border border-line bg-white"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function courseFullyVerified(course, secs) {
  if (secs.length === 0) return false;
  const sectionsOk = secs.every((s) => s.cie1Status === "verified" && s.cie2Status === "verified" && s.cie3Status === "verified");
  return sectionsOk && course.qpKeyStatus === "submitted";
}

export default function TrackingPage({ courses, sections }) {
  const [programme, setProgramme] = useState("");
  const [semester, setSemester] = useState("");
  const [query, setQuery] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const semesterOptions = useMemo(() => {
    const set = new Set(courses.filter((c) => !programme || c.programme === programme).map((c) => c.semester).filter(Boolean));
    return Array.from(set).sort((a, b) => semSortKey(a) - semSortKey(b));
  }, [courses, programme]);

  const sectionsByCourse = useMemo(() => {
    const map = new Map();
    sections.forEach((s) => {
      if (!map.has(s.courseId)) map.set(s.courseId, []);
      map.get(s.courseId).push(s);
    });
    map.forEach((arr) => arr.sort((a, b) => a.sectionNo - b.sectionNo));
    return map;
  }, [sections]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => !programme || c.programme === programme)
      .filter((c) => !semester || c.semester === semester)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .filter((c) => !onlyIncomplete || !courseFullyVerified(c, sectionsByCourse.get(c.id) || []))
      .sort((a, b) => (a.programme + a.semester).localeCompare(b.programme + b.semester) || a.code.localeCompare(b.code));
  }, [courses, programme, semester, query, onlyIncomplete, sectionsByCourse]);

  const maxSections = Math.max(1, ...filtered.map((c) => (sectionsByCourse.get(c.id) || []).length));

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 sm:px-8 py-4 flex flex-wrap items-center gap-2 border-b border-line">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textFaint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code or title…"
            className="w-full pl-8 pr-3 py-1.5 rounded-sm text-sm border border-line"
          />
        </div>
        <Select value={programme} onChange={(v) => { setProgramme(v); setSemester(""); }} options={PROGRAMME_ORDER} allLabel="All programmes" />
        <Select value={semester} onChange={setSemester} options={semesterOptions} allLabel="All semesters" />
        <label className="flex items-center gap-1.5 text-xs text-ink2 select-none">
          <input type="checkbox" checked={onlyIncomplete} onChange={(e) => setOnlyIncomplete(e.target.checked)} />
          Only show incomplete
        </label>
        <span className="text-xs ml-auto font-mono text-textFaint">{filtered.length} of {courses.length}</span>
      </div>

      <div className="px-6 sm:px-8 pt-3 flex items-center gap-4 text-xs text-ink2">
        <span className="font-semibold uppercase" style={{ letterSpacing: "0.05em" }}>Legend</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-3.5 rounded-[2px] bg-white border border-line" /> Pending</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-3.5 rounded-[2px] bg-amber" /> Submitted</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-3.5 rounded-[2px] bg-approved" /> Verified</span>
        <span className="text-textFaint">— each section cell shows CIE-1 · CIE-2 · CIE-3 left to right</span>
      </div>

      <div className="flex-1 overflow-auto px-6 sm:px-8 py-4">
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No courses match these filters" />
        ) : (
          <table className="border-separate" style={{ borderSpacing: "0 6px" }}>
            <thead>
              <tr>
                <th className="text-left text-xs px-2 pb-1 text-textFaint">Course</th>
                {Array.from({ length: maxSections }).map((_, i) => (
                  <th key={i} className="text-xs px-2 pb-1 w-16 text-textFaint">{String.fromCharCode(65 + i)}</th>
                ))}
                <th className="text-xs px-2 pb-1 text-textFaint">QP + Key</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course, idx) => {
                const secs = sectionsByCourse.get(course.id) || [];
                const secByNo = new Map(secs.map((s) => [s.sectionNo, s]));
                const band = BAND_COLORS[idx % BAND_COLORS.length];
                const bandText = BAND_TEXT[idx % BAND_TEXT.length];
                return (
                  <tr key={course.id}>
                    <td className={`px-2 rounded-sm ${band}`} style={{ minWidth: 260 }}>
                      <div className="py-1.5">
                        <div className={`text-xs font-mono ${bandText}`}>{course.code}</div>
                        <div className="text-sm truncate text-ink" style={{ maxWidth: 240 }}>{course.name}</div>
                        <div className={`text-[11px] ${bandText}`}>{course.programme}{course.semester ? ` · Sem ${course.semester}` : ""}</div>
                      </div>
                    </td>
                    {Array.from({ length: maxSections }).map((_, i) => {
                      const s = secByNo.get(i + 1);
                      return (
                        <td key={i} className={`text-center rounded-sm ${band}`}>
                          {s ? (
                            <div className="flex items-center justify-center gap-1 my-1" title={s.facultyName}>
                              <StageChip status={s.cie1Status || "pending"} stage="1" />
                              <StageChip status={s.cie2Status || "pending"} stage="2" />
                              <StageChip status={s.cie3Status || "pending"} stage="3" />
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                    <td className={`text-center rounded-sm ${band}`}>
                      {course.qpKeyStatus === "submitted" ? <Stamp text="Submitted" tone="approved" /> : <PendingTag />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
