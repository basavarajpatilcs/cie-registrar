export const EVAL_METHODS = [
  "Quiz / MCQ", "Assignment", "Case Study", "Problem-Solving Exercise", "Project Based", "Project",
  "Lab Experiment", "Practical / Lab Exam", "Written Exam", "Open-Book Test", "Seminar / PPT Presentation",
  "Group Discussion", "Debate / Group Discussion", "Viva / Oral Exam", "Research / Literature Review",
  "Report Submission", "Portfolio", "Reflective Journal / Learning Diary", "Simulation / Role Play",
  "Poster Presentation", "MOOC / Online Course", "Others (please specify)",
];

export const CIE_CAPS = { cie1: 20, cie2: 25, cie3: 25 };

export const PROGRAMME_ORDER = ["BTech", "BCA", "BSc", "MTech", "Minors", "UE"];

export const SEMESTER_ORDER = { "I": 1, "I/II": 1.5, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8 };

export const TRACK_GROUPS = [
  { key: "BTech-I", label: "BTech · Sem 1", programme: "BTech", semesters: ["I", "I/II"] },
  { key: "BTech-III", label: "BTech · Sem 3", programme: "BTech", semesters: ["III"] },
  { key: "BTech-V", label: "BTech · Sem 5", programme: "BTech", semesters: ["V"] },
  { key: "BTech-VII", label: "BTech · Sem 7", programme: "BTech", semesters: ["VII"] },
  { key: "BCA", label: "BCA", programme: "BCA", semesters: null },
  { key: "BSc", label: "BSc", programme: "BSc", semesters: null },
  { key: "MTech", label: "MTech", programme: "MTech", semesters: null },
  { key: "Minors", label: "Minors", programme: "Minors", semesters: null },
  { key: "UE", label: "University Electives", programme: "UE", semesters: null },
];

export function semSortKey(sem) {
  return SEMESTER_ORDER[(sem || "").trim().toUpperCase()] || 50;
}

export function sumMarks(list) {
  return (list || []).reduce((s, o) => s + (parseFloat(o.marks) || 0), 0);
}

export function componentsUsed(entry) {
  const c1 = (entry.cie1 || []).filter((o) => o.method).length;
  const c2 = entry.cie2 && entry.cie2.marks !== "" && entry.cie2.marks != null && !isNaN(parseFloat(entry.cie2.marks)) ? 1 : 0;
  const c3 = (entry.cie3 || []).filter((o) => o.method).length;
  return c1 + c2 + c3;
}

export function courseValidation(course) {
  const cie1Total = sumMarks(course.cie1);
  const cie3Total = sumMarks(course.cie3);
  const cie2Marks = parseFloat(course.cie2 && course.cie2.marks) || 0;
  const credits = course.credits || 0;
  const minComponents = credits + 1;
  const used = componentsUsed(course);
  return {
    cie1Total, cie3Total, cie2Marks,
    cie1Ok: cie1Total <= CIE_CAPS.cie1,
    cie2Ok: cie2Marks <= CIE_CAPS.cie2,
    cie3Ok: cie3Total <= CIE_CAPS.cie3,
    minComponents, used,
    componentsOk: used >= minComponents,
  };
}

export function defaultComponentDesign() {
  return {
    cie1: [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
    cie2: { marks: "" },
    cie3: [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
    qpKeyStatus: "pending",
  };
}
