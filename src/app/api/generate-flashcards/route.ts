// src/app/api/generate-flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

import { extractTextFromFile } from "@/lib/fileUtils";

function buildOllamaPrompt(text: string) {
  const safeText = text.slice(0, 12000);
  return `You are a helpful assistant. You MUST output ONLY valid JSON, no other text before or after.

Return a JSON array of objects in this exact format:
[
  { "question": "What is X?", "answer": "X is Y." },
  { "question": "What is Z?", "answer": "Z is W." }
]

IMPORTANT RULES:
- Output ONLY the JSON array, nothing else
- All strings must be properly escaped (use \\" for quotes inside strings)
- No trailing commas
- Keep questions short (one sentence)
- Keep answers short (1-2 sentences)
- Escape all special characters in strings

Create concise study flashcards from the following text:

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

    console.log("[generate-flashcards] Raw response length:", ollamaResp.raw.length);
    console.log("[generate-flashcards] Raw response preview:", ollamaResp.raw.substring(0, 500));

    let flashcards: any[] = [];

    // Helper function to try to extract and parse JSON array
    function tryParseJSONArray(text: string): any[] | null {
      // Strategy 1: Try to find complete JSON array with balanced brackets
      const arrayStart = text.indexOf('[');
      if (arrayStart === -1) return null;

      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidIndex = -1;

      for (let i = arrayStart; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '[') bracketCount++;
          if (char === ']') {
            bracketCount--;
            if (bracketCount === 0) {
              lastValidIndex = i;
              break;
            }
          }
        }
      }

      if (lastValidIndex > arrayStart) {
        const jsonCandidate = text.substring(arrayStart, lastValidIndex + 1);
        try {
          const parsed = JSON.parse(jsonCandidate);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.log("[generate-flashcards] Balanced bracket parse failed, trying other strategies");
        }
      }

      // Strategy 2: Try to find JSON array using regex (greedy to get complete array)
      const greedyMatch = text.match(/\[[\s\S]*\]/);
      if (greedyMatch) {
        try {
          const parsed = JSON.parse(greedyMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          // Try to fix common JSON issues
          let fixed = greedyMatch[0]
            .replace(/,\s*]/g, ']') // Remove trailing commas
            .replace(/,\s*}/g, '}') // Remove trailing commas in objects
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
            .replace(/:\s*([^",\[\]{}]+)([,}\]])/g, ': "$1"$2'); // Quote unquoted string values

          try {
            const parsed = JSON.parse(fixed);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch (e2) {
            console.log("[generate-flashcards] Fixed JSON still failed");
          }
        }
      }

      // Strategy 3: Try parsing entire response
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }

      return null;
    }

    // Try to parse JSON array
    const parsed = tryParseJSONArray(ollamaResp.raw);
    if (parsed) {
      flashcards = parsed;
      console.log("[generate-flashcards] Successfully parsed", flashcards.length, "flashcards");
    }

    // Fallback: Extract individual question/answer pairs from malformed JSON
    if (!flashcards.length) {
      console.log("[generate-flashcards] Trying to extract Q/A pairs from text...");

      // Try to find question/answer objects even if JSON is malformed
      const qaPattern = /"question"\s*:\s*"([^"]+)"\s*,\s*"answer"\s*:\s*"([^"]+)"/g;
      const matches = [...ollamaResp.raw.matchAll(qaPattern)];

      if (matches.length > 0) {
        flashcards = matches.map(match => ({
          question: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          answer: match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        }));
        console.log("[generate-flashcards] Extracted", flashcards.length, "flashcards using regex");
      }
    }

    // Fallback: Q:/A: line parsing
    if (!flashcards.length) {
      console.log("[generate-flashcards] Trying Q/A line parsing...");
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
      if (qas.length) {
        flashcards = qas;
        console.log("[generate-flashcards] Extracted", flashcards.length, "flashcards using Q/A format");
      }
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