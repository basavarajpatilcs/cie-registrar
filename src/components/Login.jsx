import React, { useState } from "react";
import { ShieldCheck, LogIn, AlertCircle } from "lucide-react";
import { signInWithGoogle } from "../lib/auth";
import { ALLOWED_EMAIL_DOMAIN } from "../lib/firebase";

export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-ink font-body px-4">
      <div className="w-full max-w-sm bg-paper rounded-sm p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck size={30} className="text-stampSoft" />
          <div className="text-xl font-semibold text-ink font-display">CIE Registrar</div>
          <div className="text-xs text-ink2 text-center">
            SoCSE · Odd Semester 2026-27
            <br />
            CIE component tracking & marks-entry verification
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-sm bg-registrar text-white text-sm font-medium py-2.5 hover:bg-ink2 transition-colors disabled:opacity-60"
        >
          <LogIn size={16} />
          {busy ? "Signing in…" : `Sign in with ${ALLOWED_EMAIL_DOMAIN} account`}
        </button>

        {error && (
          <div className="w-full flex items-start gap-2 text-xs text-stamp bg-[#F3E2DE] rounded-sm px-3 py-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-xs text-textFaint text-center leading-relaxed">
          Only @{ALLOWED_EMAIL_DOMAIN} accounts can access this portal. Faculty see
          their own sections; course leads additionally verify their courses.
        </div>
      </div>
    </div>
  );
}
