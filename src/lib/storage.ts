import { Task } from "./types";

// Key for localStorage
const STORAGE_KEY = "adhd_tasks";

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(newTask: Task) {
  const tasks = getTasks();
  tasks.push(newTask);
  saveTasks(tasks);
}

export function updateTask(updated: Task) {
  const tasks = getTasks().map((task) =>
    task.id === updated.id ? updated : task
  );
  saveTasks(tasks);
}

export function deleteTask(id: string) {
  const tasks = getTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
}
