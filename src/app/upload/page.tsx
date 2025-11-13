"use client";
import { useState } from "react";

export default function UploadPage() {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorText(null);
    setFlashcards([]);
    const fileInput = (e.currentTarget.elements.namedItem("file") as HTMLInputElement | null);
    const file = fileInput?.files ? fileInput.files[0] : null;
    if (!file) {
      setErrorText("Please choose a .pdf, .docx or .txt file.");
      return;
    }

    const allowed = [".pdf", ".txt", ".doc", ".docx"];
    const ok = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setErrorText("Unsupported file extension. Use .pdf, .doc, .docx or .txt");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await fetch("/api/generate-flashcards", { method: "POST", body: formData });
      const raw = await res.text();

      if (!res.ok) {
        // show diagnostic info if available
        try {
          const parsed = JSON.parse(raw);
          setErrorText("Server error: " + (parsed?.error || parsed?.details || raw));
          console.error("Server error response:", parsed);
        } catch {
          setErrorText("Server error: " + raw);
          console.error("Server returned non-json:", raw);
        }
        return;
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        setErrorText("Invalid JSON from server. See console for raw output.");
        console.error("Invalid JSON from server:", raw);
        return;
      }

      setFlashcards(data.flashcards || []);
    } catch (err) {
      console.error("Upload failed:", err);
      setErrorText("Upload failed: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Notes → Flashcards</h1>

      <form onSubmit={handleUpload} className="flex flex-col items-center space-y-4 w-full max-w-xl">
        <input name="file" type="file" accept=".pdf,.txt,.doc,.docx" className="border p-2 rounded-md bg-white" />
        <div className="flex gap-3">
          <button disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded">{loading ? "Generating..." : "Generate Flashcards"}</button>
        </div>
      </form>

      {errorText && <div className="mt-4 text-red-600 max-w-xl text-left"><strong>Error:</strong> {errorText}</div>}

      <div className="w-full max-w-4xl mt-8">
        {flashcards.length === 0 ? (
          <p className="text-gray-500">No flashcards yet — upload your notes to begin.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {flashcards.map((c, i) => (
              <div key={i} className="bg-white p-4 rounded shadow">
                <div className="font-semibold">{c.question}</div>
                <div className="text-gray-700 mt-2">{c.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}