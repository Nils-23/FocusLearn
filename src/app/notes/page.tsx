"use client";

import { useEffect, useState } from "react";
import { getUserNotes } from "@/lib/notes";
import { getAuth } from "firebase/auth";
import Link from "next/link";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userNotes = await getUserNotes(user.uid);
      setNotes(userNotes);
      setLoading(false);
    };

    fetchNotes();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center">
        <p>Loading your notes...</p>
      </div>
    );

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-6">Your Notes</h1>

      {notes.length === 0 ? (
        <p className="text-slate-600">
          No notes yet. Upload a file from the Upload tab!
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 hover:shadow-md transition"
            >
              <p className="font-medium">{note.fileName}</p>
              <p className="text-sm text-slate-500 mt-1">
                {note.createdAt
                  ? new Date(note.createdAt.seconds * 1000).toLocaleString()
                  : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}