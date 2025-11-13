"use client";
import { useState, useEffect } from "react";

export default function UploadPage() {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorText(null);
    setFlashcards([]);
    setGenerated(false);

    const fileInput = e.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files ? fileInput.files[0] : null;
    if (!file) return setErrorText("Please choose a .pdf, .docx or .txt file.");

    const allowed = [".pdf", ".txt", ".doc", ".docx"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext)))
      return setErrorText("Unsupported file extension. Use .pdf, .doc, .docx or .txt");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await fetch("/api/generate-flashcards", { method: "POST", body: formData });
      const raw = await res.text();
      if (!res.ok) {
        try {
          const parsed = JSON.parse(raw);
          setErrorText("Server error: " + (parsed?.error || parsed?.details || raw));
        } catch {
          setErrorText("Server error: " + raw);
        }
        return;
      }

      const data = JSON.parse(raw);
      setFlashcards(data.flashcards || []);
      setFlipped(Array(data.flashcards?.length || 0).fill(false));
      setGenerated(true);
    } catch (err) {
      setErrorText("Upload failed: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = (index: number) => {
    setFlipped((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  // motivational checkpoints
  const completedCount = flipped.filter(Boolean).length;
  const progressMsg =
    completedCount === 0
      ? "Start flipping cards to test yourself!"
      : completedCount < flashcards.length
      ? `Nice! You’ve reviewed ${completedCount} of ${flashcards.length} cards.`
      : "Awesome! 🎉 You’ve completed all cards!";

  return (
    <div className="min-h-screen flex flex-col items-center p-8 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-4">Upload Notes → Flashcards</h1>

      <form onSubmit={handleUpload} className="flex flex-col items-center space-y-4 w-full max-w-xl">
        <input
          name="file"
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          className="border p-2 rounded-md bg-white dark:bg-slate-800 dark:text-gray-100"
        />
        <button
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Flashcards"}
        </button>
      </form>

      {errorText && (
        <div className="mt-4 text-red-600 dark:text-red-400 max-w-xl text-left">
          <strong>Error:</strong> {errorText}
        </div>
      )}

      {generated && (
        <div className="mt-6 text-center text-slate-700 dark:text-slate-300 animate-fadeIn">
          <p className="font-medium">{progressMsg}</p>
        </div>
      )}

      <div className="w-full max-w-5xl mt-8">
        {flashcards.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No flashcards yet — upload your notes to begin.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {flashcards.map((c, i) => (
              <div
                key={i}
                className={`flashcard ${flipped[i] ? "flipped" : ""} animate-fadeIn`}
                onClick={() => handleFlip(i)}
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front flex flex-col justify-center items-center text-center">
                    <div className="font-semibold text-lg">{c.question}</div>
                    <p className="text-xs text-gray-400 mt-2">(Tap to reveal answer)</p>
                  </div>
                  <div className="flashcard-back flex items-center justify-center text-center">
                    <p className="text-base">{c.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}