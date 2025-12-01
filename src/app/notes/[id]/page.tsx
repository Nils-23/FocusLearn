"use client";

import { useEffect, useState, useRef } from "react";
import { getNoteById } from "@/lib/notes";
import { useParams } from "next/navigation";

export default function NoteViewerPage() {
  const { id } = useParams();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"file" | "flashcards">("file");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const n = await getNoteById(id as string);
      setNote(n);
      setLoading(false);
      // If flashcards exist, default to flashcards view
      if (n?.flashcards && n.flashcards.length > 0) {
        setViewMode("flashcards");
      }
    };
    load();
  }, [id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (note?.flashcards && currentIndex < note.flashcards.length - 1) {
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

  if (loading)
    return (
      <div className="p-8 text-center">
        <p>Loading...</p>
      </div>
    );

  if (!note)
    return (
      <div className="p-8 text-center">
        <p>Note not found.</p>
      </div>
    );

  const url = note.fileURL?.toLowerCase() || "";
  const flashcards = note.flashcards || [];
  const currentCard = flashcards[currentIndex];

  const isPDF = url.endsWith(".pdf");
  const isTXT = url.endsWith(".txt");
  const isDOCX = url.endsWith(".doc") || url.endsWith(".docx");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 p-6 md:p-10">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {note.fileName}
        </h1>

        {/* Tab switcher */}
        {flashcards.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="bg-white/20 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-1.5 border border-white/30 dark:border-slate-700/30 shadow-lg">
              <button
                onClick={() => setViewMode("file")}
                className={`px-6 py-2 rounded-xl transition-all font-medium ${
                  viewMode === "file"
                    ? "bg-white/40 dark:bg-slate-700/40 text-blue-600 dark:text-blue-400 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/20"
                }`}
              >
                📄 File
              </button>
              <button
                onClick={() => setViewMode("flashcards")}
                className={`px-6 py-2 rounded-xl transition-all font-medium ${
                  viewMode === "flashcards"
                    ? "bg-white/40 dark:bg-slate-700/40 text-blue-600 dark:text-blue-400 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/20"
                }`}
              >
                🎴 Flashcards ({flashcards.length})
              </button>
            </div>
          </div>
        )}

        {/* File view */}
        {viewMode === "file" && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 dark:border-slate-700/50 p-4">
            {isPDF && (
              <iframe
                src={note.fileURL}
                className="w-full h-[80vh] rounded-lg"
              />
            )}

            {isTXT && (
              <iframe
                src={note.fileURL}
                className="w-full h-[80vh] rounded-lg"
              />
            )}

            {isDOCX && (
              <div className="text-center">
                <p className="text-slate-600 dark:text-gray-300 mb-3">
                  DOCX file detected. Converting inside viewer…
                </p>
                <iframe
                  src={`https://docs.google.com/gview?url=${note.fileURL}&embedded=true`}
                  className="w-full h-[80vh] rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Flashcards view */}
        {viewMode === "flashcards" && flashcards.length > 0 && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-4xl mx-auto">
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
                  transform: `perspective(1000px) rotateY(${isFlipped ? 180 : 0}deg) ${
                    mousePosition.x && mousePosition.y
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
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex
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
      </div>
    </div>
  );
}