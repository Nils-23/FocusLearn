// src/app/api/generate-flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const name = file.name.toLowerCase();
  const type = file.type || "";

  // ✅ Handle PDF files
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    // Dynamic import (ESM-friendly)
    const pdfParseModule = await import("pdf-parse").catch((e) => {
      throw new Error("pdf-parse import failed: " + String(e));
    });

    // 🧠 Properly detect usable function (ESM/CJS safe)
    const pdfParse: any =
      typeof pdfParseModule === "function"
        ? pdfParseModule
        : typeof (pdfParseModule as any).default === "function"
        ? (pdfParseModule as any).default
        : null;

    if (!pdfParse) {
      throw new Error(
        "pdf-parse import succeeded, but no valid parse function was found"
      );
    }

    try {
      const parsed = await pdfParse(buffer);
      return String(parsed?.text || "");
    } catch (e: any) {
      throw new Error("pdf-parse failed: " + String(e));
    }
  }

  // ✅ Handle Word documents (.docx / .doc)
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    const mammoth = await import("mammoth").catch((e) => {
      throw new Error("mammoth import failed: " + String(e));
    });

    try {
      const result = await mammoth.extractRawText({ buffer });
      return String(result?.value || "");
    } catch (e: any) {
      throw new Error("mammoth parse failed: " + String(e));
    }
  }

  // ✅ Handle plain text
  if (type === "text/plain" || name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type: " + type + " / " + name);
}

function buildOllamaPrompt(text: string) {
  const safeText = text.slice(0, 12000);
  return `You are a helpful assistant that must output valid JSON only.
Return an array of objects (no explanation) of the form:
[
  { "question": "<short question>", "answer": "<short answer>" },
  ...
]

Create concise study flashcards from the following text. Each flashcard should be one QA pair; keep answers short (1-2 sentences).

TEXT:
${safeText}`;
}

async function callOllama(prompt: string) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2:latest",
      prompt,
      // Get a single JSON object back instead of a line-stream
      stream: false,
    }),
  });

  // Ollama returns a JSON object when stream=false, with `response` containing model text
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
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("[generate-flashcards] file:", file.name, file.type, file.size);

    const extractedText = await extractTextFromFile(file);
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Failed to extract text from file" },
        { status: 500 }
      );
    }

    const prompt = buildOllamaPrompt(extractedText);
    console.log(
      "[generate-flashcards] sending prompt to Ollama, prompt length:",
      prompt.length
    );

    const ollamaResp = await callOllama(prompt);
    console.log(
      "[generate-flashcards] Ollama status:",
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

    // Try to extract JSON array from response (non-greedy to avoid over-capture)
    const match = ollamaResp.raw.match(/\[[\s\S]*?\]/);
    let flashcards: any[] = [];

    if (match) {
      try {
        flashcards = JSON.parse(match[0]);
      } catch (e) {
        console.error("[generate-flashcards] JSON parse failed:", e);
      }
    }

    // Fallback to parsing entire response
    if (!flashcards.length) {
      try {
        const parsed = JSON.parse(ollamaResp.raw);
        if (Array.isArray(parsed)) flashcards = parsed;
      } catch {
        // ignore
      }
    }

    // Fallback: Q:/A: line parsing
    if (!flashcards.length) {
      const lines = ollamaResp.raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 200);

      const qas: any[] = [];
      for (let i = 0; i < lines.length - 1; i++) {
        const qLine = lines[i];
        const aLine = lines[i + 1];
        if (/^Q[:\-\s]/i.test(qLine) && /^A[:\-\s]/i.test(aLine)) {
          qas.push({
            question: qLine.replace(/^Q[:\-\s]+/i, ""),
            answer: aLine.replace(/^A[:\-\s]+/i, ""),
          });
        }
      }
      if (qas.length) flashcards = qas;
    }

    if (!flashcards.length) {
      return NextResponse.json(
        {
          error: "AI did not return parsable flashcards",
          raw: ollamaResp.raw,
        },
        { status: 500 }
      );
    }

    if (flashcards.length > 200) flashcards = flashcards.slice(0, 200);

    return NextResponse.json({ flashcards });
  } catch (err: any) {
    console.error("[generate-flashcards] Exception:", err);
    return NextResponse.json(
      { error: "Failed to process file", details: String(err) },
      { status: 500 }
    );
  }
}