import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/fileUtils";

export const runtime = "nodejs";

function buildHighlightPrompt(text: string) {
    const safeText = text.slice(0, 12000);
    return `You are a helpful study assistant.
  
Your task is to analyze the following text and identify the most important concepts, definitions, and key points that a student should focus on.

Output the EXACT same text provided, but wrap the important parts in <mark> tags.
Do NOT change any words. Do NOT summarize. Just add <mark> tags around key phrases or sentences.
Do NOT add any markdown formatting like **bold** or *italic*, ONLY use <mark> tags.
Do NOT add any introductory or concluding text. Output ONLY the highlighted text.

Text to highlight:
${safeText}`;
}

async function callOllama(prompt: string) {
    const OLLAMA_TIMEOUT = 120000; // 2 minutes timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);

    try {
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3.2:latest",
                prompt,
                stream: false,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let raw = "";
        try {
            const data = await res.json();
            raw =
                typeof data === "string"
                    ? data
                    : typeof data?.response === "string"
                        ? data.response
                        : JSON.stringify(data);
        } catch {
            raw = await res.text();
        }
        return { ok: res.ok, status: res.status, raw };
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
            throw new Error("Ollama request timed out after 2 minutes. Please ensure Ollama is running and try again.");
        }

        if (error.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED")) {
            throw new Error("Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434. Install from https://ollama.ai");
        }

        if (error.message?.includes("fetch failed")) {
            throw new Error("Failed to connect to Ollama. Please check if Ollama is running: ollama serve");
        }

        throw new Error(`Ollama request failed: ${error.message || String(error)}`);
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        console.log("[highlight-notes] file:", file.name, file.type, file.size);

        const extractedText = await extractTextFromFile(file);
        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json(
                { error: "Failed to extract text from file" },
                { status: 500 }
            );
        }

        const prompt = buildHighlightPrompt(extractedText);
        console.log(
            "[highlight-notes] sending prompt to Ollama, prompt length:",
            prompt.length
        );

        const ollamaResp = await callOllama(prompt);
        console.log(
            "[highlight-notes] Ollama status:",
            ollamaResp.status,
            "ok:",
            ollamaResp.ok
        );

        if (!ollamaResp.ok) {
            return NextResponse.json(
                {
                    error: "Ollama returned error",
                    status: ollamaResp.status,
                    raw: ollamaResp.raw,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({ highlightedText: ollamaResp.raw });
    } catch (err: any) {
        console.error("[highlight-notes] Exception:", err);
        return NextResponse.json(
            { error: "Failed to process file", details: String(err) },
            { status: 500 }
        );
    }
}
