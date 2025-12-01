"use client";
import { useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { useUpload } from "@/context/UploadContext";
import { useLockdown } from "@/context/LockdownContext";

export default function UploadPage() {
  const {
    flashcards, setFlashcards,
    mode, setMode,
    highlightedText, setHighlightedText,
    currentIndex, setCurrentIndex,
    isFlipped, setIsFlipped,
    loading, setLoading,
    loadingMessage, setLoadingMessage,
    errorText, setErrorText,
    generated, setGenerated
  } = useUpload();

  const { timer, startLockdown } = useLockdown();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const auth = getAuth();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Restore focus mode if timer is running (e.g. after file picker closed)
    if (timer.isRunning) {
      await startLockdown();
    }

    setErrorText(null);
    setFlashcards([]);
    setHighlightedText("");
    setGenerated(false);
    setCurrentIndex(0);
    setIsFlipped(false);

    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files ? fileInput.files[0] : null;
    if (!file) return setErrorText("Please choose a .pdf, .docx or .txt file.");

    const allowed = [".pdf", ".txt", ".doc", ".docx"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext)))
      return setErrorText("Unsupported file extension. Use .pdf, .doc, .docx or .txt");

    if (mode === 'flashcards' && !auth.currentUser) {
      return setErrorText("You must be logged in to generate flashcards.");
    }

    try {
      setLoading(true);
      setLoadingMessage("Extracting text from file...");

      // Generate flashcards directly without saving to Firebase
      const formData = new FormData();
      formData.append("file", file);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000); // 2.5 minutes

      setLoadingMessage(
        mode === 'flashcards'
          ? "Generating flashcards with AI... (this may take 1-2 minutes)"
          : "Analyzing and highlighting notes... (this may take 1-2 minutes)"
      );

      try {
        console.log(`[upload] Starting ${mode} generation request...`);
        const endpoint = mode === 'flashcards' ? "/api/generate-flashcards" : "/api/highlight-notes";

        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("[upload] Response received, status:", res.status, res.ok);
        const raw = await res.text();

        if (!res.ok) {
          try {
            const parsed = JSON.parse(raw);
            const errorMsg = parsed?.error || parsed?.details || raw;

            // Provide helpful error messages
            if (errorMsg.includes("Ollama") || errorMsg.includes("localhost:11434")) {
              setErrorText(
                "Ollama connection error: " + errorMsg +
                "\n\nPlease ensure Ollama is installed and running:\n" +
                "1. Install from https://ollama.ai\n" +
                "2. Run: ollama serve\n" +
                "3. Pull model: ollama pull llama3.2"
              );
            } else {
              setErrorText("Server error: " + errorMsg);
            }
          } catch {
            setErrorText("Server error: " + raw);
          }
          return;
        }

        const data = JSON.parse(raw);

        if (mode === 'flashcards') {
          const generatedFlashcards = data.flashcards || [];
          console.log("[upload] Generated flashcards count:", generatedFlashcards.length);

          if (generatedFlashcards.length === 0) {
            setErrorText("No flashcards were generated. Please try with a different file or check the file content.");
            return;
          }

          // Display flashcards directly without saving
          setFlashcards(generatedFlashcards);
        } else {
          const text = data.highlightedText || "";
          if (!text) {
            setErrorText("No highlighted text returned.");
            return;
          }
          setHighlightedText(text);
        }

        setGenerated(true);
        console.log(`[upload] ${mode} generated successfully`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error("[upload] Fetch error:", fetchError);

        if (fetchError.name === "AbortError") {
          setErrorText(
            "Request timed out. The flashcard generation is taking too long.\n\n" +
            "Possible solutions:\n" +
            "1. Try with a smaller file\n" +
            "2. Ensure Ollama is running and responsive\n" +
            "3. Check your internet connection"
          );
        } else {
          setErrorText("Network error: " + (fetchError.message || String(fetchError)));
        }
        return;
      }
    } catch (err) {
      console.error("[upload] Outer catch error:", err);
      setErrorText("Upload failed: " + String(err));
    } finally {
      console.log("[upload] Finally block - resetting loading state");
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 z-0">
        {/* Soft light blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center p-8">
        {/* Upload form */}
        {!generated && (
          <div className="w-full max-w-xl mt-8">
            <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Upload Notes
            </h1>

            {/* Mode Selection */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl flex shadow-sm backdrop-blur-sm">
                <button
                  onClick={() => setMode('flashcards')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'flashcards'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/30'
                    }`}
                >
                  Flashcards
                </button>
                <button
                  onClick={() => setMode('highlight')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'highlight'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/30'
                    }`}
                >
                  AI Highlight
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col items-center space-y-4">
              <div className="w-full">
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-60 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                {loading ? "Processing..." : mode === 'flashcards' ? "Generate Flashcards" : "Highlight Notes"}
              </button>

              {loading && loadingMessage && (
                <div className="mt-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 text-center">
                  <p className="text-slate-700 dark:text-slate-200 font-medium">{loadingMessage}</p>
                  <div className="mt-3 w-full bg-white/40 dark:bg-slate-700/40 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              )}
            </form>

            {errorText && (
              <div className="mt-6 p-4 rounded-2xl bg-red-50/80 dark:bg-red-900/30 backdrop-blur-md border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-300 max-w-xl">
                <strong>Error:</strong> {errorText}
              </div>
            )}
          </div>
        )}

        {/* Highlighted Text Display */}
        {generated && mode === 'highlight' && highlightedText && (
          <div className="w-full max-w-4xl mx-auto mt-8 p-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Highlighted Notes</h2>
              <button
                onClick={() => setGenerated(false)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Upload Another
              </button>
            </div>
            <div
              className="prose dark:prose-invert max-w-none prose-mark:bg-yellow-200 dark:prose-mark:bg-yellow-900/50 prose-mark:text-slate-800 dark:prose-mark:text-white prose-mark:px-1 prose-mark:rounded"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
          </div>
        )}

        {/* Flashcard display */}
        {generated && mode === 'flashcards' && flashcards.length > 0 && (
          <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-4xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-8 text-center">
              <p className="text-white/90 dark:text-slate-200 text-lg font-medium mb-2">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
              <div className="w-64 h-1.5 bg-white/20 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Glassmorphic flashcard */}
            <div
              ref={cardRef}
              className="relative w-full max-w-2xl aspect-[4/3] cursor-pointer group"
              onClick={handleFlip}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setMousePosition({ x: 0.5, y: 0.5 })}
            >
              <div
                className={`flashcard-glass ${isFlipped ? "flipped" : ""}`}
                style={{
                  transform: `perspective(1000px) rotateY(${isFlipped ? 180 : 0}deg) ${mousePosition.x && mousePosition.y
                    ? `rotateX(${((mousePosition.y - 0.5) * 5)}deg) rotateY(${((mousePosition.x - 0.5) * -5)}deg)`
                    : ""
                    } translateY(${mousePosition.x && mousePosition.y ? "-8px" : "0px"})`,
                }}
              >
                <div className="flashcard-inner-glass">
                  {/* Front side */}
                  <div className="flashcard-front-glass">
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                      <div className="text-2xl md:text-3xl font-semibold text-white mb-4 leading-relaxed">
                        {currentCard.question}
                      </div>
                      <p className="text-white/60 text-sm mt-6">Click to reveal answer</p>
                    </div>
                  </div>

                  {/* Back side */}
                  <div className="flashcard-back-glass">
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                      <div className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                        {currentCard.answer}
                      </div>
                      <p className="text-white/60 text-sm mt-6">Click to flip back</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-6 mt-12">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                disabled={currentIndex === 0}
                className="nav-button-glass disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous card"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex gap-2">
                {flashcards.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                      setIsFlipped(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentIndex
                      ? "bg-white w-8"
                      : "bg-white/40 hover:bg-white/60"
                      }`}
                    aria-label={`Go to card ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={currentIndex === flashcards.length - 1}
                className="nav-button-glass disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next card"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {generated && mode === 'flashcards' && flashcards.length === 0 && (
          <div className="text-center text-white/80 dark:text-slate-300 mt-12">
            <p>No flashcards generated. Please try uploading again.</p>
          </div>
        )}
      </div>
    </div>
  );
}