import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Chip, StatusBadge, CapBadge, Stamp, PendingTag } from "./ui";
import { CIE_CAPS, courseValidation } from "../lib/constants";

export default function CourseDetailModal({ course, sections, onClose }) {
  if (!course) return null;
  const v = courseValidation(course);

  return (
    <div className="fixed inset-0 z-40 flex justify-end font-body">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col bg-paper">
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-ink">
          <button onClick={onClose} className="absolute top-5 right-5 text-white opacity-70 hover:opacity-100">
            <X size={20} />
          </button>
          <div className="text-xs tracking-widest uppercase mb-1 text-[#93A6C2]" style={{ letterSpacing: "0.1em" }}>
            {course.programme} {course.semester ? `· Sem ${course.semester}` : ""}
          </div>
          <div className="text-xl font-semibold pr-8 text-white font-display">{course.name}</div>
          <div className="text-sm mt-1 text-[#B9C6D9] font-mono">{course.code}</div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Chip>{course.category}</Chip>
            <Chip>{course.credits ? `${course.credits} credits` : "credits n/a"}</Chip>
            <Chip>{course.seeType || "SEE n/a"}</Chip>
            {course.track && <Chip tone="navy">{course.track}</Chip>}
          </div>

          <div className="rounded-sm p-3 flex items-center justify-between bg-white border border-line">
            <div>
              <div className="text-xs uppercase tracking-wide text-textFaint" style={{ letterSpacing: "0.06em" }}>Course Lead</div>
              <div className={`text-sm font-medium ${course.leadEmail ? "text-ink" : "text-stamp"}`}>
                {course.leadName || "Not on record"}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs uppercase tracking-wide text-textFaint" style={{ letterSpacing: "0.06em" }}>CIE-2 QP + Key</div>
              {course.qpKeyStatus === "submitted" ? <Stamp text="Submitted" tone="approved" /> : <PendingTag />}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-sm p-4 bg-white border border-line">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>CIE-1</h4>
                <CapBadge total={v.cie1Total} cap={CIE_CAPS.cie1} />
              </div>
              {(course.cie1 || []).filter((o) => o.method).length === 0 ? (
                <div className="text-sm text-textFaint">Not mapped yet.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {course.cie1.filter((o) => o.method).map((o, i) => (
                    <div key={i} className="flex justify-between text-sm text-ink">
                      <span>{o.method}</span><span className="font-mono">{o.marks || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-sm p-4 bg-white border border-line">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>
                  CIE-2 <span className="font-normal normal-case text-textFaint">· single route</span>
                </h4>
                <CapBadge total={v.cie2Marks} cap={CIE_CAPS.cie2} />
              </div>
              <div className="text-sm text-ink2">Question Paper · Scrutiny · Answer Key</div>
            </div>

            <div className="rounded-sm p-4 bg-white border border-line">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>CIE-3</h4>
                <CapBadge total={v.cie3Total} cap={CIE_CAPS.cie3} />
              </div>
              {(course.cie3 || []).filter((o) => o.method).length === 0 ? (
                <div className="text-sm text-textFaint">Not mapped yet.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {course.cie3.filter((o) => o.method).map((o, i) => (
                    <div key={i} className="flex justify-between text-sm text-ink">
                      <span>{o.method}</span><span className="font-mono">{o.marks || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!v.componentsOk && (
              <div className="flex items-center gap-1.5 text-xs text-stamp font-body">
                <AlertTriangle size={13} /> Only {v.used} of the {v.minComponents} required components are mapped
              </div>
            )}
          </div>

          <div>
            <span className="text-xs uppercase tracking-wide font-semibold text-ink2" style={{ letterSpacing: "0.07em" }}>
              Section-wise marks-entry status
            </span>
            {sections.length === 0 ? (
              <div className="mt-2 text-sm rounded-sm p-3 bg-[#F3E2DE] text-stamp border border-line">
                No section-faculty assignment on record for this course.
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                {sections.map((s) => (
                  <div key={s.id} className="rounded-sm px-3 py-2 flex items-center gap-3 bg-white border border-line">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold bg-paperDeep text-registrar font-mono shrink-0">
                      {String.fromCharCode(64 + s.sectionNo)}
                    </span>
                    <span className="text-sm flex-1 truncate text-ink">{s.facultyName}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={s.cie1Status || "pending"} />
                      <StatusBadge status={s.cie2Status || "pending"} />
                      <StatusBadge status={s.cie3Status || "pending"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
