// scripts/seed.js
//
// One-time (or re-run-safe) import of the SoCSE Odd Sem 2026-27 course list
// into Firestore. Run this AFTER you've created your Firebase project and
// downloaded a service account key.
//
// Setup:
//   1. Firebase console -> Project settings -> Service accounts
//      -> Generate new private key -> save as scripts/serviceAccountKey.json
//      (this file is already in .gitignore — never commit it)
//   2. npm run seed
//
// What it does:
//   - Writes one doc per course to the `courses` collection, with an empty
//     CIE-1/2/3 component design (course leads fill this in from the app).
//   - Writes one doc per course-section-faculty assignment to `sections`,
//     each starting at status "pending" for every CIE stage.
//   - Faculty emails are GUESSED from the name on record (firstname.lastname
//     @<domain>) because the source spreadsheet only had names. A CSV of the
//     guessed mapping is written to scripts/faculty-email-mapping.csv —
//     REVIEW AND CORRECT THIS before relying on it, then re-run the seed
//     (it's idempotent: it overwrites by deterministic doc ID).
//   - Also ensures at least one admin doc exists, from ADMIN_EMAILS below.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EMAIL_DOMAIN = process.env.SEED_EMAIL_DOMAIN || "rvu.edu.in";

// Add the email(s) of whoever should have full admin access (exam office
// coordinators, etc.) — they must sign in at least once before rules that
// depend on auth.uid-based checks would matter, but the admin doc itself
// can be seeded ahead of time by email.
const ADMIN_EMAILS = [
  // "exam.office@rvu.edu.in",
];

function loadServiceAccount() {
  const p = path.join(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(p)) {
    console.error(
      "\nMissing scripts/serviceAccountKey.json.\n" +
      "Download one from Firebase console -> Project settings -> Service accounts\n" +
      "-> Generate new private key, save it at that path, then re-run `npm run seed`.\n"
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function slugifyName(name) {
  return (name || "")
    .replace(/\b(Dr|Prof|Mr|Ms|Mrs)\.?\s*/gi, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function guessEmail(name) {
  const parts = slugifyName(name);
  if (parts.length === 0) return null;
  const local = parts.join(".");
  return `${local}@${EMAIL_DOMAIN}`;
}

function courseDocId(course) {
  return `${course.programme}__${course.code}`.replace(/[^A-Za-z0-9_]/g, "_");
}

async function main() {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const courses = JSON.parse(fs.readFileSync(path.join(__dirname, "courses_data.json"), "utf8"));

  const emailRows = [["faculty_name", "guessed_email", "verified_correct(y/n)"]];
  const facultyEmails = new Map();
  function emailFor(name) {
    if (!name) return null;
    if (!facultyEmails.has(name)) {
      const email = guessEmail(name);
      facultyEmails.set(name, email);
      emailRows.push([name, email || "", ""]);
    }
    return facultyEmails.get(name);
  }

  let courseBatch = db.batch();
  let sectionBatch = db.batch();
  let courseCount = 0, sectionCount = 0;

  for (const course of courses) {
    const id = courseDocId(course);
    const leadEmail = emailFor(course.lead);
    const courseRef = db.collection("courses").doc(id);
    courseBatch.set(courseRef, {
      code: course.code,
      name: course.name,
      programme: course.programme,
      semester: course.semester,
      credits: course.credits || null,
      category: course.category,
      seeType: course.seeType || null,
      track: course.track || null,
      leadName: course.lead || null,
      leadEmail: leadEmail || null,
      cie1: [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
      cie2: { marks: "" },
      cie3: [{ method: "", marks: "" }, { method: "", marks: "" }, { method: "", marks: "" }],
      qpKeyStatus: "pending",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: "seed-script",
    }, { merge: true });
    courseCount += 1;

    for (const s of course.sections || []) {
      const facultyEmail = emailFor(s.faculty);
      const sectionId = `${id}__${s.section}`;
      const sectionRef = db.collection("sections").doc(sectionId);
      sectionBatch.set(sectionRef, {
        courseId: id,
        courseCode: course.code,
        courseName: course.name,
        programme: course.programme,
        semester: course.semester,
        sectionNo: s.section,
        facultyName: s.faculty,
        facultyEmail: facultyEmail || null,
        cie1Status: "pending",
        cie2Status: "pending",
        cie3Status: "pending",
      }, { merge: true });
      sectionCount += 1;

      // Firestore batches cap at 500 writes.
      if (sectionCount % 400 === 0) {
        await sectionBatch.commit();
        sectionBatch = db.batch();
      }
    }
    if (courseCount % 400 === 0) {
      await courseBatch.commit();
      courseBatch = db.batch();
    }
  }

  await courseBatch.commit();
  await sectionBatch.commit();

  for (const email of ADMIN_EMAILS) {
    await db.collection("admins").doc(email.toLowerCase()).set({ addedBy: "seed-script" });
  }

  const csv = emailRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  fs.writeFileSync(path.join(__dirname, "faculty-email-mapping.csv"), csv);

  console.log(`\nSeeded ${courseCount} courses and ${sectionCount} sections.`);
  console.log(`Wrote scripts/faculty-email-mapping.csv with ${facultyEmails.size} guessed faculty emails.`);
  console.log("IMPORTANT: review that CSV against your actual staff directory before faculty rely on this portal —");
  console.log("guessed emails (firstname.lastname@" + EMAIL_DOMAIN + ") will not all be correct.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
