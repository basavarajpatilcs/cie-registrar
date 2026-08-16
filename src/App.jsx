import React, { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "./lib/AuthContext";
import { signOutUser } from "./lib/auth";
import { subscribeCourses, subscribeSections } from "./lib/firestore";
import Login from "./components/Login";
import { Sidebar, MobileNav, TopBar } from "./components/Nav";
import MySectionsPage from "./pages/MySectionsPage";
import CoursesILeadPage from "./pages/CoursesILeadPage";
import DirectoryPage from "./pages/DirectoryPage";
import TrackingPage from "./pages/TrackingPage";
import AnalysisPage from "./pages/AnalysisPage";

const PAGE_META = {
  mine: ["My Sections", "Mark your own CIE-1 / CIE-2 / CIE-3 marks entry as submitted, section by section."],
  lead: ["Courses I Lead", "Design each course's CIE components and verify your faculty's submissions."],
  directory: ["Directory", "Browse every course's CIE component design and verification status."],
  tracking: ["CIE Tracking", "Institution-wide verification matrix, by programme and semester."],
  analysis: ["Component Analysis", "How evaluation methods are actually being used, once mapped."],
};

function DataError({ message }) {
  return (
    <div className="px-6 sm:px-8 py-6">
      <div className="flex items-start gap-2 text-sm text-stamp bg-[#F3E2DE] rounded-sm px-4 py-3 max-w-xl">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-medium">Couldn't load data from Firestore.</div>
          <div className="mt-1 text-xs">{message}</div>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { user, isAdmin } = useAuth();
  const [page, setPage] = useState("mine");
  const [courses, setCourses] = useState(null);
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub1 = subscribeCourses(setCourses, (e) => setError(e.message));
    const unsub2 = subscribeSections(setSections, (e) => setError(e.message));
    return () => { unsub1(); unsub2(); };
  }, []);

  const isLead = useMemo(() => {
    if (!courses) return false;
    return courses.some((c) => (c.leadEmail || "").toLowerCase() === (user.email || "").toLowerCase());
  }, [courses, user.email]);

  useEffect(() => {
    if (page === "lead" && !isLead && !isAdmin) setPage("mine");
  }, [page, isLead, isAdmin]);

  const loadingData = courses === null || sections === null;
  const [title, subtitle] = PAGE_META[page];

  return (
    <div className="w-full flex font-body" style={{ background: "#F4F1E7", height: "100vh", minHeight: 600 }}>
      <Sidebar page={page} setPage={setPage} isLead={isLead} isAdmin={isAdmin} user={user} onSignOut={signOutUser} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav page={page} setPage={setPage} isLead={isLead} isAdmin={isAdmin} />
        <TopBar title={title} subtitle={subtitle} />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {error ? (
            <DataError message={error} />
          ) : loadingData ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-registrar" />
            </div>
          ) : (
            <>
              {page === "mine" && <MySectionsPage courses={courses} sections={sections} />}
              {page === "lead" && <CoursesILeadPage courses={courses} sections={sections} />}
              {page === "directory" && <DirectoryPage courses={courses} sections={sections} />}
              {page === "tracking" && <TrackingPage courses={courses} sections={sections} />}
              {page === "analysis" && <AnalysisPage courses={courses} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-ink">
        <Loader2 size={22} className="animate-spin text-white" />
      </div>
    );
  }

  if (!user) return <Login />;

  return <Shell />;
}
