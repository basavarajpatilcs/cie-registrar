import React, { useMemo, useState } from "react";
import { UserCheck } from "lucide-react";
import { EmptyState, StatusBadge, Chip } from "../components/ui";
import { markSectionSubmitted } from "../lib/firestore";
import { useAuth } from "../lib/AuthContext";

const STAGES = [
  { key: "cie1", label: "CIE-1" },
  { key: "cie2", label: "CIE-2" },
  { key: "cie3", label: "CIE-3" },
];

export default function MySectionsPage({ courses, sections }) {
  const { user } = useAuth();
  const [busyKey, setBusyKey] = useState(null);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const mine = useMemo(() => {
    return sections
      .filter((s) => (s.facultyEmail || "").toLowerCase() === (user.email || "").toLowerCase())
      .map((s) => ({ ...s, course: courseMap.get(s.courseId) }))
      .filter((s) => s.course)
      .sort((a, b) => a.course.code.localeCompare(b.course.code) || a.sectionNo - b.sectionNo);
  }, [sections, courseMap, user.email]);

  async function handleSubmit(section, stage) {
    const key = `${section.id}-${stage}`;
    setBusyKey(key);
    try {
      await markSectionSubmitted(section.id, stage, user);
    } catch (e) {
      alert(`Couldn't update: ${e.message}`);
    } finally {
      setBusyKey(null);
    }
  }

  if (mine.length === 0) {
    return (
      <div className="px-6 sm:px-8 py-6">
        <EmptyState
          icon={UserCheck}
          title="No sections on record for your account"
          body="If you teach a section this semester and don't see it here, ask your exam office coordinator to check the faculty email mapping."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
      <div className="flex flex-col gap-3 max-w-3xl">
        {mine.map((s) => (
          <div key={s.id} className="rounded-sm bg-white border border-line p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs font-mono text-textFaint">{s.course.code} · Section {String.fromCharCode(64 + s.sectionNo)}</div>
                <div className="text-sm font-medium text-ink">{s.course.name}</div>
                <div className="flex gap-1.5 mt-1">
                  <Chip>{s.course.programme}{s.course.semester ? ` · Sem ${s.course.semester}` : ""}</Chip>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STAGES.map((stage) => {
                const status = s[`${stage.key}Status`] || "pending";
                const key = `${s.id}-${stage.key}`;
                return (
                  <div key={stage.key} className="flex flex-col gap-1.5 items-start rounded-sm bg-paper px-3 py-2">
                    <span className="text-xs font-semibold text-ink2 uppercase" style={{ letterSpacing: "0.05em" }}>{stage.label}</span>
                    <StatusBadge status={status} />
                    {status === "pending" && (
                      <button
                        onClick={() => handleSubmit(s, stage.key)}
                        disabled={busyKey === key}
                        className="text-xs text-registrar underline mt-1 disabled:opacity-50"
                      >
                        {busyKey === key ? "Saving…" : "Mark as submitted"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
