import { db } from "./firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export async function getUserNotes(userId: string) {
  const q = query(collection(db, "notes"), where("userId", "==", userId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getNoteById(id: string) {
  const ref = doc(db, "notes", id);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}