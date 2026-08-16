import React, { useMemo, useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import { EmptyState, StatusBadge, Stamp, PendingTag } from "../components/ui";
import { TRACK_GROUPS } from "../lib/constants";

const STAGE_TABS = [
  { key: "cie1", label: "CIE-1" },
  { key: "cie2", label: "CIE-2" },
  { key: "cie3", label: "CIE-3" },
  { key: "qpkey", label: "QP + Key" },
];

const BAND_COLORS = [
  "bg-[#F6E4D8]", "bg-[#DCE8DA]", "bg-[#E9DCE4]", "bg-[#DCE3EE]",
  "bg-[#E6DEEE]", "bg-[#F1EAC9]", "bg-[#F0DCD6]", "bg-[#D6E7E6]",
];
const BAND_TEXT = [
  "text-[#8A4A26]", "text-[#3D6B4F]", "text-[#7A3F5C]", "text-[#2C4A73]",
  "text-[#5B4587]", "text-[#8A731F]", "text-[#A23B2E]", "text-[#2E6F6A]",
];

export default function TrackingPage({ courses, sections }) {
  const [groupKey, setGroupKey] = useState(TRACK_GROUPS[0].key);
  const [stage, setStage] = useState("cie1");

  const group = TRACK_GROUPS.find((g) => g.key === groupKey);
  const groupCourses = useMemo(() => {
    return courses
      .filter((c) => c.programme === group.programme)
      .filter((c) => !group.semesters || group.semesters.includes(c.semester))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [courses, group]);

  const sectionsByCourse = useMemo(() => {
    const map = new Map();
    sections.forEach((s) => {
      if (!map.has(s.courseId)) map.set(s.courseId, []);
      map.get(s.courseId).push(s);
    });
    map.forEach((arr) => arr.sort((a, b) => a.sectionNo - b.sectionNo));
    return map;
  }, [sections]);

  const maxSections = Math.max(1, ...groupCourses.map((c) => (sectionsByCourse.get(c.id) || []).length));

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 sm:px-8 pt-4 flex flex-col gap-3 border-b border-line">
        <div className="flex flex-wrap gap-1.5">
          {TRACK_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setGroupKey(g.key)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium ${groupKey === g.key ? "bg-ink text-white" : "bg-paperDeep text-ink2"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 pb-3">
          {STAGE_TABS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={`px-3 py-1 rounded-sm text-xs font-semibold uppercase border ${stage === s.key ? "bg-registrar text-white border-registrar" : "text-ink2 border-line"}`}
              style={{ letterSpacing: "0.04em" }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 sm:px-8 py-4">
        {groupCourses.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No courses in this group" />
        ) : stage === "qpkey" ? (
          <div className="flex flex-col gap-1.5 max-w-2xl">
            {groupCourses.map((course, idx) => (
              <div key={course.id} className={`flex items-center gap-3 rounded-sm px-3 py-2 ${BAND_COLORS[idx % BAND_COLORS.length]}`}>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs mr-2 font-mono ${BAND_TEXT[idx % BAND_TEXT.length]}`}>{course.code}</span>
                  <span className="text-sm text-ink">{course.name}</span>
                  <div className={`text-xs mt-0.5 ${BAND_TEXT[idx % BAND_TEXT.length]}`}>{course.leadName || "Lead not on record"}</div>
                </div>
                {course.qpKeyStatus === "submitted" ? <Stamp text="Submitted" tone="approved" /> : <PendingTag />}
              </div>
            ))}
          </div>
        ) : (
          <table className="border-separate" style={{ borderSpacing: "0 6px" }}>
            <thead>
              <tr>
                <th className="text-left text-xs px-2 pb-1 text-textFaint">Course</th>
                {Array.from({ length: maxSections }).map((_, i) => (
                  <th key={i} className="text-xs px-2 pb-1 w-10 text-textFaint">{String.fromCharCode(65 + i)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupCourses.map((course, idx) => {
                const secs = sectionsByCourse.get(course.id) || [];
                const secByNo = new Map(secs.map((s) => [s.sectionNo, s]));
                return (
                  <tr key={course.id}>
                    <td className={`px-2 rounded-sm ${BAND_COLORS[idx % BAND_COLORS.length]}`} style={{ minWidth: 260 }}>
                      <div className="py-1.5">
                        <div className={`text-xs font-mono ${BAND_TEXT[idx % BAND_TEXT.length]}`}>{course.code}</div>
                        <div className="text-sm truncate text-ink" style={{ maxWidth: 240 }}>{course.name}</div>
                      </div>
                    </td>
                    {Array.from({ length: maxSections }).map((_, i) => {
                      const secNo = i + 1;
                      const s = secByNo.get(secNo);
                      if (!s) return <td key={i} className={`text-center rounded-sm ${BAND_COLORS[idx % BAND_COLORS.length]}`} />;
                      const status = s[`${stage}Status`] || "pending";
                      const done = status === "verified";
                      const submitted = status === "submitted";
                      return (
                        <td key={i} className={`text-center rounded-sm ${BAND_COLORS[idx % BAND_COLORS.length]}`}>
                          <div
                            title={`${s.facultyName} — ${status}`}
                            className={`w-7 h-7 my-1 rounded-sm flex items-center justify-center mx-auto border-[1.5px] ${
                              done ? "bg-approved border-approved" : submitted ? "bg-amberSoft border-amber" : "bg-white border-line"
                            }`}
                          >
                            {done && <Check size={14} color="white" />}
                          </div>
                        </td>
                      );
                    })}
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
