import { signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { auth, googleProvider, ALLOWED_EMAIL_DOMAIN } from "./firebase";

export class DomainRejectedError extends Error {
  constructor(email) {
    super(`"${email}" is not a ${ALLOWED_EMAIL_DOMAIN} account. Signed out.`);
    this.name = "DomainRejectedError";
  }
}

/**
 * Signs in with Google, then double-checks the resulting email against the
 * allowed institutional domain client-side. The `hd` parameter on the
 * provider steers the Google account picker toward the right domain, but a
 * user could still pick a personal Google account in some flows — so this
 * check (plus the Firestore security rules) is what actually enforces it.
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email || "";
  if (!email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)) {
    await fbSignOut(auth);
    throw new DomainRejectedError(email);
  }
  return result.user;
}

export function signOutUser() {
  return fbSignOut(auth);
}
