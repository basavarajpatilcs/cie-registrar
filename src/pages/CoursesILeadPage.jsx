import React, { useMemo, useState } from "react";
import { ClipboardList, Save } from "lucide-react";
import { EmptyState, Chip, CapBadge, ValidationWarning, StatusBadge, Stamp, PendingTag } from "../components/ui";
import { EVAL_METHODS, CIE_CAPS, courseValidation } from "../lib/constants";
import { saveComponentDesign, setQpKeyStatus, setSectionStatus } from "../lib/firestore";
import { useAuth } from "../lib/AuthContext";

function MethodRow({ letter, option, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-5 text-center font-mono text-textFaint">{letter}</span>
      <select
        value={option.method}
        onChange={(e) => onChange({ ...option, method: e.target.value })}
        className="flex-1 rounded-sm px-2 py-1.5 text-sm border border-line bg-white"
      >
        <option value="">Choose evaluation method…</option>
        {EVAL_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <input
        type="number" min="0"
        value={option.marks}
        onChange={(e) => onChange({ ...option, marks: e.target.value })}
        placeholder="0"
        className="w-16 rounded-sm px-2 py-1.5 text-sm text-right border border-line font-mono"
      />
    </div>
  );
}

function CourseLeadCard({ course, sections, user, isAdmin }) {
  const [draft, setDraft] = useState({
    cie1: course.cie1 || [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
    cie2: course.cie2 || { marks: "" },
    cie3: course.cie3 || [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const v = courseValidation(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify({ cie1: course.cie1, cie2: course.cie2, cie3: course.cie3 });

  async function handleSave() {
    setSaving(true);
    try {
      await saveComponentDesign(course.id, draft, user);
    } catch (e) {
      alert(`Couldn't save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleQpKeyToggle() {
    const next = course.qpKeyStatus === "submitted" ? "pending" : "submitted";
    try {
      await setQpKeyStatus(course.id, next, user);
    } catch (e) {
      alert(`Couldn't update: ${e.message}`);
    }
  }

  async function handleSectionAction(section, stage, status) {
    const key = `${section.id}-${stage}-${status}`;
    setBusyKey(key);
    try {
      await setSectionStatus(section.id, stage, status, user);
    } catch (e) {
      alert(`Couldn't update: ${e.message}`);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="rounded-sm bg-white border border-line p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-textFaint">{course.code}</div>
          <div className="text-lg font-semibold text-ink font-display">{course.name}</div>
          <div className="flex gap-1.5 mt-1.5">
            <Chip>{course.programme}{course.semester ? ` · Sem ${course.semester}` : ""}</Chip>
            <Chip>{course.category}</Chip>
            <Chip>{course.credits ? `${course.credits} credits` : "credits n/a"}</Chip>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs uppercase text-textFaint" style={{ letterSpacing: "0.06em" }}>CIE-2 QP + Key</span>
          <button onClick={handleQpKeyToggle}>
            {course.qpKeyStatus === "submitted" ? <Stamp text="Submitted" tone="approved" /> : <PendingTag />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-ink2" style={{ letterSpacing: "0.07em" }}>Component design</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm font-mono ${v.componentsOk ? "text-approved bg-approvedSoft" : "text-stamp bg-[#F3E2DE]"}`}>
            {v.used} / {v.minComponents} components min.
          </span>
        </div>

        <div className="rounded-sm border border-line p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>CIE-1</h4>
            <CapBadge total={v.cie1Total} cap={CIE_CAPS.cie1} />
          </div>
          <div className="flex flex-col gap-2">
            {draft.cie1.map((opt, i) => (
              <MethodRow key={i} letter={String.fromCharCode(65 + i)} option={opt}
                onChange={(next) => setDraft((d) => ({ ...d, cie1: d.cie1.map((o, idx) => idx === i ? next : o) }))} />
            ))}
          </div>
          {!v.cie1Ok && <ValidationWarning>Exceeds the {CIE_CAPS.cie1}-mark cap</ValidationWarning>}
        </div>

        <div className="rounded-sm border border-line p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>
              CIE-2 <span className="font-normal normal-case text-textFaint">· single route</span>
            </h4>
            <CapBadge total={v.cie2Marks} cap={CIE_CAPS.cie2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm flex-1 text-ink2">Question Paper · Scrutiny · Answer Key</span>
            <input
              type="number" min="0"
              value={draft.cie2.marks}
              onChange={(e) => setDraft((d) => ({ ...d, cie2: { marks: e.target.value } }))}
              className="w-16 rounded-sm px-2 py-1.5 text-sm text-right border border-line font-mono"
            />
          </div>
          {!v.cie2Ok && <ValidationWarning>Exceeds the {CIE_CAPS.cie2}-mark cap</ValidationWarning>}
        </div>

        <div className="rounded-sm border border-line p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>CIE-3</h4>
            <CapBadge total={v.cie3Total} cap={CIE_CAPS.cie3} />
          </div>
          <div className="flex flex-col gap-2">
            {draft.cie3.map((opt, i) => (
              <MethodRow key={i} letter={String.fromCharCode(65 + i)} option={opt}
                onChange={(next) => setDraft((d) => ({ ...d, cie3: d.cie3.map((o, idx) => idx === i ? next : o) }))} />
            ))}
          </div>
          {!v.cie3Ok && <ValidationWarning>Exceeds the {CIE_CAPS.cie3}-mark cap</ValidationWarning>}
        </div>

        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start flex items-center gap-1.5 text-xs font-medium text-white bg-registrar rounded-sm px-3 py-1.5 disabled:opacity-60"
          >
            <Save size={13} /> {saving ? "Saving…" : "Save component design"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase font-semibold text-ink2" style={{ letterSpacing: "0.07em" }}>Section verification</span>
        {sections.length === 0 ? (
          <div className="text-sm text-stamp bg-[#F3E2DE] rounded-sm px-3 py-2">No section-faculty assignment on record.</div>
        ) : (
          sections.map((s) => (
            <div key={s.id} className="rounded-sm bg-paper px-3 py-2 flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold bg-paperDeep text-registrar font-mono shrink-0">
                {String.fromCharCode(64 + s.sectionNo)}
              </span>
              <span className="text-sm flex-1 truncate text-ink">{s.facultyName}</span>
              <div className="flex items-center gap-3 shrink-0">
                {["cie1", "cie2", "cie3"].map((stage) => {
                  const status = s[`${stage}Status`] || "pending";
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <StatusBadge status={status} />
                      {status === "submitted" && (
                        <button
                          onClick={() => handleSectionAction(s, stage, "verified")}
                          disabled={busyKey === `${s.id}-${stage}-verified`}
                          className="text-[10px] text-approved underline disabled:opacity-50"
                        >
                          verify
                        </button>
                      )}
                      {status === "verified" && (
                        <button
                          onClick={() => handleSectionAction(s, stage, "submitted")}
                          disabled={busyKey === `${s.id}-${stage}-submitted`}
                          className="text-[10px] text-textFaint underline disabled:opacity-50"
                        >
                          revert
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CoursesILeadPage({ courses, sections }) {
  const { user, isAdmin } = useAuth();

  const myCourses = useMemo(() => {
    return courses
      .filter((c) => isAdmin || (c.leadEmail || "").toLowerCase() === (user.email || "").toLowerCase())
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [courses, user.email, isAdmin]);

  if (myCourses.length === 0) {
    return (
      <div className="px-6 sm:px-8 py-6">
        <EmptyState icon={ClipboardList} title="You are not recorded as the lead for any course" body="If this looks wrong, ask your exam office coordinator to check the course-lead mapping." />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
      <div className="flex flex-col gap-4 max-w-3xl">
        {myCourses.map((course) => (
          <CourseLeadCard
            key={course.id}
            course={course}
            sections={sections.filter((s) => s.courseId === course.id).sort((a, b) => a.sectionNo - b.sectionNo)}
            user={user}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}
