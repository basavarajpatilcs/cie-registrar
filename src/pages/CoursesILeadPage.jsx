import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Save, Search, CheckCircle2, Circle } from "lucide-react";
import { EmptyState, Chip, CapBadge, ValidationWarning, StatusBadge, Stamp, PendingTag } from "../components/ui";
import { EVAL_METHODS, CIE_CAPS, PROGRAMME_ORDER, semSortKey, courseValidation } from "../lib/constants";
import { saveComponentDesign, setQpKeyStatus, setSectionStatus } from "../lib/firestore";
import { useAuth } from "../lib/AuthContext";

function Select({ value, onChange, options, allLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-sm px-2.5 py-1.5 text-xs border border-line bg-white w-full"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

function hasCie1(course) { return (course.cie1 || []).some((o) => o.method); }
function hasCie2(course) { return course.cie2 && course.cie2.marks !== "" && course.cie2.marks != null; }
function hasCie3(course) { return (course.cie3 || []).some((o) => o.method); }

const CIE_FILTERS = [
  { value: "", label: "Any CIE status" },
  { value: "missing-cie1", label: "Missing CIE-1" },
  { value: "missing-cie2", label: "Missing CIE-2" },
  { value: "missing-cie3", label: "Missing CIE-3" },
  { value: "none", label: "Nothing mapped yet" },
  { value: "complete", label: "Fully mapped (all 3)" },
];

function MiniDot({ filled, label }) {
  return filled
    ? <CheckCircle2 size={13} className="text-approved" title={`${label}: mapped`} />
    : <Circle size={13} className="text-line" title={`${label}: not mapped`} />;
}

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

function CourseDetail({ course, sections, user }) {
  const [draft, setDraft] = useState({
    cie1: course.cie1 || [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
    cie2: course.cie2 || { marks: "" },
    cie3: course.cie3 || [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState(null);

  // Reset the draft whenever a different course is selected.
  useEffect(() => {
    setDraft({
      cie1: course.cie1 || [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
      cie2: course.cie2 || { marks: "" },
      cie3: course.cie3 || [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

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
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-textFaint">{course.code}</div>
          <div className="text-xl font-semibold text-ink font-display">{course.name}</div>
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

      {/* All three CIEs, always visible together — no tab-switching to see the full picture. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-sm p-4 bg-white border border-line">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>CIE-1</h4>
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

        <div className="rounded-sm p-4 bg-white border border-line">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>
              CIE-2 <span className="font-normal normal-case text-textFaint">· single route</span>
            </h4>
            <CapBadge total={v.cie2Marks} cap={CIE_CAPS.cie2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm flex-1 text-ink2">QP · Scrutiny · Answer Key</span>
            <input
              type="number" min="0"
              value={draft.cie2.marks}
              onChange={(e) => setDraft((d) => ({ ...d, cie2: { marks: e.target.value } }))}
              className="w-16 rounded-sm px-2 py-1.5 text-sm text-right border border-line font-mono"
            />
          </div>
          {!v.cie2Ok && <ValidationWarning>Exceeds the {CIE_CAPS.cie2}-mark cap</ValidationWarning>}
        </div>

        <div className="rounded-sm p-4 bg-white border border-line">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold uppercase text-registrar" style={{ letterSpacing: "0.05em" }}>CIE-3</h4>
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
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm font-mono ${v.componentsOk ? "text-approved bg-approvedSoft" : "text-stamp bg-[#F3E2DE]"}`}>
          {v.used} / {v.minComponents} components min. (credits + 1)
        </span>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-registrar rounded-sm px-3 py-1.5 disabled:opacity-60"
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
            <div key={s.id} className="rounded-sm bg-white border border-line px-3 py-2 flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold bg-paperDeep text-registrar font-mono shrink-0">
                {String.fromCharCode(64 + s.sectionNo)}
              </span>
              <span className="text-sm flex-1 truncate text-ink">{s.facultyName}</span>
              <div className="flex items-center gap-3 shrink-0">
                {["cie1", "cie2", "cie3"].map((stage) => {
                  const status = s[`${stage}Status`] || "pending";
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-textFaint uppercase">{stage.replace("cie", "C")}</span>
                      <StatusBadge status={status} />
                      {status === "submitted" && (
                        <button
                          onClick={() => handleSectionAction(s, stage, "verified")}
                          disabled={busyKey === `${s.id}-${stage}-verified`}
                          className="text-[10px] text-approved underline disabled:opacity-50"
                        >verify</button>
                      )}
                      {status === "verified" && (
                        <button
                          onClick={() => handleSectionAction(s, stage, "submitted")}
                          disabled={busyKey === `${s.id}-${stage}-submitted`}
                          className="text-[10px] text-textFaint underline disabled:opacity-50"
                        >revert</button>
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
  const [programme, setProgramme] = useState("");
  const [semester, setSemester] = useState("");
  const [cieFilter, setCieFilter] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const myCourses = useMemo(() => {
    return courses
      .filter((c) => isAdmin || (c.leadEmail || "").toLowerCase() === (user.email || "").toLowerCase())
      .sort((a, b) => (a.programme + a.semester).localeCompare(b.programme + b.semester) || a.code.localeCompare(b.code));
  }, [courses, user.email, isAdmin]);

  useEffect(() => {
    if (!selectedId && myCourses.length > 0) setSelectedId(myCourses[0].id);
  }, [myCourses, selectedId]);

  const semesterOptions = useMemo(() => {
    const set = new Set(myCourses.filter((c) => !programme || c.programme === programme).map((c) => c.semester).filter(Boolean));
    return Array.from(set).sort((a, b) => semSortKey(a) - semSortKey(b));
  }, [myCourses, programme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myCourses
      .filter((c) => !programme || c.programme === programme)
      .filter((c) => !semester || c.semester === semester)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .filter((c) => {
        if (cieFilter === "missing-cie1") return !hasCie1(c);
        if (cieFilter === "missing-cie2") return !hasCie2(c);
        if (cieFilter === "missing-cie3") return !hasCie3(c);
        if (cieFilter === "none") return !hasCie1(c) && !hasCie2(c) && !hasCie3(c);
        if (cieFilter === "complete") return hasCie1(c) && hasCie2(c) && hasCie3(c);
        return true;
      });
  }, [myCourses, programme, semester, cieFilter, query]);

  if (myCourses.length === 0) {
    return (
      <div className="px-6 sm:px-8 py-6">
        <EmptyState icon={ClipboardList} title="You are not recorded as the lead for any course" body="If this looks wrong, ask your exam office coordinator to check the course-lead mapping." />
      </div>
    );
  }

  const selected = courses.find((c) => c.id === selectedId) || filtered[0] || myCourses[0];
  const selectedSections = sections.filter((s) => s.courseId === selected.id).sort((a, b) => a.sectionNo - b.sectionNo);

  const programmeOptions = Array.from(new Set(myCourses.map((c) => c.programme)))
    .sort((a, b) => PROGRAMME_ORDER.indexOf(a) - PROGRAMME_ORDER.indexOf(b));

  return (
    <div className="flex-1 flex min-h-0">
      <div className="w-full sm:w-80 shrink-0 border-r border-line flex flex-col min-h-0">
        <div className="p-3 flex flex-col gap-2 border-b border-line">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textFaint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search my courses…"
              className="w-full pl-7 pr-2 py-1.5 rounded-sm text-xs border border-line"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={programme} onChange={(v) => { setProgramme(v); setSemester(""); }} options={programmeOptions} allLabel="All programmes" />
            <Select value={semester} onChange={setSemester} options={semesterOptions} allLabel="All semesters" />
          </div>
          <Select value={cieFilter} onChange={setCieFilter} options={CIE_FILTERS} allLabel="Any CIE status" />
          <span className="text-[11px] text-textFaint font-mono">{filtered.length} of {myCourses.length} courses</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-xs text-textFaint text-center py-8 px-4">No courses match these filters.</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-lineSoft flex flex-col gap-1 ${selected.id === c.id ? "bg-white" : "hover:bg-white/60"}`}
                style={selected.id === c.id ? { borderLeft: "3px solid #2C4A73" } : { borderLeft: "3px solid transparent" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-textFaint">{c.code}</span>
                  <div className="flex items-center gap-1">
                    <MiniDot filled={hasCie1(c)} label="CIE-1" />
                    <MiniDot filled={hasCie2(c)} label="CIE-2" />
                    <MiniDot filled={hasCie3(c)} label="CIE-3" />
                  </div>
                </div>
                <span className="text-sm text-ink leading-snug">{c.name}</span>
                <span className="text-[11px] text-textFaint">{c.programme}{c.semester ? ` · Sem ${c.semester}` : ""}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <CourseDetail course={selected} sections={selectedSections} user={user} />
      </div>
    </div>
  );
}
