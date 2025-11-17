// src/lib/pomodoro.ts
import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// Each user has 1 document in: pomodoro/{uid}
export async function getUserPomodoro(uid: string) {
  const ref = doc(db, "pomodoro", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Initialize with zero
    await setDoc(ref, { sessions: 0 });
    return 0;
  }

  return snap.data().sessions || 0;
}

export async function incrementPomodoro(uid: string) {
  const ref = doc(db, "pomodoro", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { sessions: 1 });
    return 1;
  }

  const current = snap.data().sessions || 0;
  await updateDoc(ref, { sessions: current + 1 });

  return current + 1;
}

export async function resetPomodoro(uid: string) {
  const ref = doc(db, "pomodoro", uid);
  await setDoc(ref, { sessions: 0 });
  return 0;
}