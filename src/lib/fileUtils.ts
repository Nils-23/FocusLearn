import { Buffer } from "buffer";

export async function extractTextFromFile(file: File): Promise<string> {
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
