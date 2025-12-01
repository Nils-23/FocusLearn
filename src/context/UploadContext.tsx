"use client";
import React, { createContext, useContext, useState } from "react";

interface UploadContextType {
    flashcards: any[];
    setFlashcards: (cards: any[]) => void;
    mode: 'flashcards' | 'highlight';
    setMode: (mode: 'flashcards' | 'highlight') => void;
    highlightedText: string;
    setHighlightedText: (text: string) => void;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    loadingMessage: string;
    setLoadingMessage: (msg: string) => void;
    errorText: string | null;
    setErrorText: (error: string | null) => void;
    generated: boolean;
    setGenerated: (generated: boolean) => void;
    resetUploadState: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function useUpload() {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error("useUpload must be used within a UploadProvider");
    }
    return context;
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [mode, setMode] = useState<'flashcards' | 'highlight'>('flashcards');
    const [highlightedText, setHighlightedText] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const [errorText, setErrorText] = useState<string | null>(null);
    const [generated, setGenerated] = useState(false);

    const resetUploadState = () => {
        setFlashcards([]);
        setHighlightedText("");
        setCurrentIndex(0);
        setIsFlipped(false);
        setLoading(false);
        setLoadingMessage("");
        setErrorText(null);
        setGenerated(false);
    };

    return (
        <UploadContext.Provider value={{
            flashcards, setFlashcards,
            mode, setMode,
            highlightedText, setHighlightedText,
            currentIndex, setCurrentIndex,
            isFlipped, setIsFlipped,
            loading, setLoading,
            loadingMessage, setLoadingMessage,
            errorText, setErrorText,
            generated, setGenerated,
            resetUploadState
        }}>
            {children}
        </UploadContext.Provider>
    );
}
