import {
  collection, onSnapshot, doc, updateDoc, serverTimestamp, query,
} from "firebase/firestore";
import { db } from "./firebase";

export function subscribeCourses(onData, onError) {
  return onSnapshot(collection(db, "courses"), (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(rows);
  }, onError);
}

export function subscribeSections(onData, onError) {
  return onSnapshot(collection(db, "sections"), (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(rows);
  }, onError);
}

/** Faculty: move one CIE stage on a section from "pending" to "submitted". */
export async function markSectionSubmitted(sectionId, stage, user) {
  await updateDoc(doc(db, "sections", sectionId), {
    [`${stage}Status`]: "submitted",
    [`${stage}UpdatedAt`]: serverTimestamp(),
    [`${stage}UpdatedBy`]: user.email,
  });
}

/** Course lead: verify a section's CIE stage, or send it back to pending. */
export async function setSectionStatus(sectionId, stage, status, user) {
  await updateDoc(doc(db, "sections", sectionId), {
    [`${stage}Status`]: status,
    [`${stage}UpdatedAt`]: serverTimestamp(),
    [`${stage}UpdatedBy`]: user.email,
  });
}

/** Course lead: save the CIE-1/2/3 component design (methods + marks). */
export async function saveComponentDesign(courseId, { cie1, cie2, cie3 }, user) {
  await updateDoc(doc(db, "courses", courseId), {
    cie1, cie2, cie3,
    updatedAt: serverTimestamp(),
    updatedBy: user.email,
  });
}

/** Course lead: toggle CIE-2 Question Paper + Answer Key submission. */
export async function setQpKeyStatus(courseId, status, user) {
  await updateDoc(doc(db, "courses", courseId), {
    qpKeyStatus: status,
    updatedAt: serverTimestamp(),
    updatedBy: user.email,
  });
}
