import type { Task } from "./types";
import { v4 as uuidv4 } from "uuid";

// Temporary in-memory storage for dev
export const tasks: Task[] = [
  {
    id: uuidv4(),
    title: "Finish ADHD app structure",
    completed: false,
  },
  {
    id: uuidv4(),
    title: "Take a 10 min focus break",
    completed: true,
  },
];
