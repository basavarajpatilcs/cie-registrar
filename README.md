# CIE Registrar

A CIE (Continuous Internal Evaluation) component-mapping and marks-entry
verification portal for RV University's School of Computer Science and
Engineering — built with React + Vite, Firebase Auth (Google Sign-In
restricted to `@rvu.edu.in`), and Firestore.

- **Faculty** sign in and mark their own section's CIE-1 / CIE-2 / CIE-3
  marks entry as *Submitted*.
- **Course leads** design each course's CIE-1/2/3 evaluation methods (with
  the 20 / 25 / 25-mark caps and a credits+1 minimum-components check),
  track CIE-2 Question Paper + Answer Key submission, and *Verify* their
  faculty's submissions.
- Everyone signed in with an institutional account can browse the read-only
  **Directory**, **CIE Tracking** matrix, and **Component Analysis** charts.

Pre-loaded with the 128 real courses (BTech, BSc, BCA, MTech, Minors,
University Electives) and ~300 section-faculty assignments already compiled
for Odd Sem 2026-27.

---

## 1. Create the Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   - If your Google Workspace domain is `rvu.edu.in`, sign-in is further
     restricted client-side (see `src/lib/firebase.js` / `src/lib/auth.js`)
     and enforced server-side by Firestore rules (step 3) — no extra Firebase
     console setting is required for the domain restriction itself.
3. **Build → Firestore Database → Create database** (start in production
   mode; the rules below replace the defaults).
4. **Project settings → General → Your apps → Add app → Web (`</>`)**. Copy
   the config values shown — you'll need them for `.env.local` (step 4) and
   for GitHub secrets (step 6).
5. **Project settings → Service accounts → Generate new private key.** Save
   the downloaded file as `scripts/serviceAccountKey.json` (already
   git-ignored — never commit it).

## 2. Deploy the Firestore security rules

In the Firebase console → **Firestore Database → Rules**, paste the
contents of [`firestore.rules`](./firestore.rules) and publish. (Or install
the [Firebase CLI](https://firebase.google.com/docs/cli) and run
`firebase deploy --only firestore:rules`.)

These rules are the actual security boundary — read them before relying on
this in production. In short: only `@rvu.edu.in` accounts (or emails listed
in the `admins` collection) can read or write anything; a course's CIE
component design can only be edited by that course's recorded lead; a
section's status can only be moved to "submitted" by its assigned faculty
and to "verified" by that course's lead. **These were authored carefully
but could not be run against a live Firestore emulator in the environment
that produced them — test them yourself in the console's Rules Playground
before go-live.**

## 3. Install dependencies and configure environment

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with the Web app config values from step 1.4.

## 4. Seed the database

```bash
npm run seed
```

This writes all 128 courses and ~300 sections to Firestore. **Faculty
emails are guessed** as `firstname.lastname@rvu.edu.in` from the names on
record, because the source data only had names, not email addresses. The
script writes `scripts/faculty-email-mapping.csv` — **open this, correct
any wrong guesses against your actual staff directory, then re-run
`npm run seed`** (it's safe to re-run; it overwrites by deterministic
document ID). Until this mapping is correct, faculty may not see their own
sections under "My Sections."

To grant admin access (full read/write, bypassing the lead/faculty
matching — useful for exam office coordinators), add their email to the
`ADMIN_EMAILS` array in `scripts/seed.js` before seeding, or manually add a
document to the `admins` collection in the Firebase console with the
lower-cased email as the document ID.

## 5. Run it locally

```bash
npm run dev
```

## 6. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. **Repo → Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Repo → Settings → Secrets and variables → Actions**, add each of these
   as a repository secret (same values as `.env.local`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ALLOWED_EMAIL_DOMAIN` (`rvu.edu.in`)
4. Push to `main` — [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
   builds and deploys automatically. The site will be at
   `https://<your-github-username>.github.io/<repo-name>/`.
5. **Firebase console → Authentication → Settings → Authorized domains** →
   add `<your-github-username>.github.io` (Google Sign-In will otherwise
   refuse to run on an unrecognised domain).

Deploying to Vercel or Netlify instead works too — just set the same
environment variables in their dashboard and use `npm run build` /
`dist` as the build command / output directory (leave `VITE_BASE_PATH`
unset so it defaults to `/`).

---

## Project structure

```
src/
  lib/
    firebase.js       Firebase app/auth/db initialization
    auth.js            Google sign-in with domain enforcement
    AuthContext.jsx     React context: current user + admin flag
    firestore.js       Firestore reads/writes
    constants.js        Evaluation methods, CIE mark caps, shared helpers
  components/
    Login.jsx, Nav.jsx, ui.jsx, CourseDetailModal.jsx
  pages/
    MySectionsPage.jsx     Faculty: mark own sections submitted
    CoursesILeadPage.jsx    Lead: design components + verify sections
    DirectoryPage.jsx        Everyone: browse all courses (read-only)
    TrackingPage.jsx          Everyone: CIE matrix by programme/semester
    AnalysisPage.jsx          Everyone: evaluation-method usage charts
  App.jsx               Auth gate + live Firestore subscriptions + routing
scripts/
  seed.js                One-time import of courses_data.json into Firestore
  courses_data.json       The 128 courses + section-faculty assignments
firestore.rules           Security rules (see step 2 above)
```

## Data model

- **`courses/{courseId}`** — course info + `cie1`/`cie3` (3-option arrays of
  `{method, marks}`), `cie2` (`{marks}`), `qpKeyStatus`, `leadName`/`leadEmail`.
- **`sections/{courseId}__{sectionNo}`** — one doc per section-faculty
  assignment, with `cie1Status` / `cie2Status` / `cie3Status`, each one of
  `"pending"` → `"submitted"` (faculty) → `"verified"` (lead).
- **`admins/{email}`** — existence of a doc grants full admin access.

## Known limitations / things to double-check before go-live

- **Faculty email addresses are guessed**, not authoritative — see step 4.
  A faculty member whose guessed email is wrong simply won't see their
  sections until it's corrected in Firestore (or re-seeded).
- **Security rules were hand-written and not tested against a live
  Firestore emulator** in the environment that produced this project —
  review and test them in the Firebase console before relying on them.
- The **`hd` domain hint** on the Google sign-in button steers the account
  picker but is not itself a hard restriction; the real enforcement is the
  post-sign-in email check (`src/lib/auth.js`) plus the Firestore rules.
- **Component design (CIE-1/2/3 evaluation methods)** starts empty for
  every course — course leads need to fill these in; until then the
  Analysis page and the mark-cap checks have nothing to show.
