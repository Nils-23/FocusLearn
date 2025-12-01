// src/lib/tasks.ts
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";

/**
 * Fetch all tasks for a specific user
 */
export async function getUserTasks(uid: string) {
  const q = query(collection(db, "tasks"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];
}

/**
 * Add a new task for the current user
 */
export async function addUserTask(
  uid: string,
  task: { title: string; description?: string; dueDate?: string }
) {
  const taskData = {
    uid,
    title: task.title,
    description: task.description || null,
    dueDate: task.dueDate || null,
    completed: false,
    createdAt: new Date(),
  };
  return await addDoc(collection(db, "tasks"), taskData);
}

/**
 * Toggle task completion
 */
export async function toggleTaskCompleted(taskId: string, completed: boolean) {
  const ref = doc(db, "tasks", taskId);
  return updateDoc(ref, { completed });
}

/**
 * Delete a task
 */
export async function deleteUserTask(taskId: string) {
  const ref = doc(db, "tasks", taskId);
  return deleteDoc(ref);
}

/**
 * Edit a task's title or dueDate
 */
export async function updateUserTask(
  taskId: string,
  updates: { title?: string; dueDate?: string }
) {
  const ref = doc(db, "tasks", taskId);
  return updateDoc(ref, updates);
}