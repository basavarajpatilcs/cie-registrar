import React, { useMemo, useState } from "react";
import { Search, ChevronRight, BookOpen } from "lucide-react";
import { EmptyState, Chip } from "../components/ui";
import CourseDetailModal from "../components/CourseDetailModal";
import { PROGRAMME_ORDER, semSortKey } from "../lib/constants";

function StageDot({ status }) {
  const cls = status === "verified" ? "bg-approved border-approved" : status === "submitted" ? "bg-amberSoft border-amber" : "bg-transparent border-line";
  return <span className={`inline-block rounded-full w-2.5 h-2.5 border-[1.5px] ${cls}`} />;
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

export default function DirectoryPage({ courses, sections }) {
  const [programme, setProgramme] = useState("");
  const [semester, setSemester] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [openCourse, setOpenCourse] = useState(null);

  const semesterOptions = useMemo(() => {
    const set = new Set(courses.filter((c) => !programme || c.programme === programme).map((c) => c.semester).filter(Boolean));
    return Array.from(set).sort((a, b) => semSortKey(a) - semSortKey(b));
  }, [courses, programme]);

  const categoryOptions = useMemo(() => Array.from(new Set(courses.map((c) => c.category))).sort(), [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => !programme || c.programme === programme)
      .filter((c) => !semester || c.semester === semester)
      .filter((c) => !category || c.category === category)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .sort((a, b) => (a.programme + a.semester).localeCompare(b.programme + b.semester) || a.code.localeCompare(b.code));
  }, [courses, programme, semester, category, query]);

  const sectionsFor = (courseId) => sections.filter((s) => s.courseId === courseId).sort((a, b) => a.sectionNo - b.sectionNo);

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
        <Select value={category} onChange={setCategory} options={categoryOptions} allLabel="All categories" />
        <span className="text-xs ml-auto font-mono text-textFaint">{filtered.length} of {courses.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses match" body="Try clearing a filter or search term." />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((course) => {
              const secs = sectionsFor(course.id);
              const stageStatus = (stage) => {
                if (secs.length === 0) return "none";
                const vals = secs.map((s) => s[`${stage}Status`] || "pending");
                if (vals.every((v) => v === "verified")) return "verified";
                if (vals.some((v) => v !== "pending")) return "submitted";
                return "pending";
              };
              return (
                <button
                  key={course.id}
                  onClick={() => setOpenCourse(course)}
                  className="flex items-center gap-3 rounded-sm px-4 py-3 text-left hover:shadow-sm transition-shadow bg-white border border-line"
                >
                  <div className="w-24 shrink-0 text-xs font-mono text-textFaint">{course.code}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-ink">{course.name}</div>
                    <div className="flex gap-1.5 mt-1">
                      <Chip>{course.programme}{course.semester ? ` · Sem ${course.semester}` : ""}</Chip>
                      <Chip>{course.category}</Chip>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end shrink-0 text-xs text-textFaint">
                    <span>{course.leadName || "no lead"}</span>
                    <span>{secs.length} section{secs.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StageDot status={stageStatus("cie1")} />
                    <StageDot status={stageStatus("cie2")} />
                    <StageDot status={stageStatus("cie3")} />
                  </div>
                  <ChevronRight size={16} className="text-textFaint" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openCourse && (
        <CourseDetailModal course={openCourse} sections={sectionsFor(openCourse.id)} onClose={() => setOpenCourse(null)} />
      )}
    </div>
  );
}
