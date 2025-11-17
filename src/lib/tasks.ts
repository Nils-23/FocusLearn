import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

export async function getUserTasks(uid: string) {
  const q = query(collection(db, "tasks"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];
}

export async function addUserTask(uid: string, task: any) {
  return await addDoc(collection(db, "tasks"), {
    uid,
    ...task,
  });
}

export async function toggleTaskCompleted(taskId: string, completed: boolean) {
  const ref = doc(db, "tasks", taskId);
  return updateDoc(ref, { completed });
}