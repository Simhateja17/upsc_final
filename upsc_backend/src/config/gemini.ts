import mammoth from "mammoth";
import { azureClient, chatDeployment, generateJSON as azureGenerateJSON } from "./azure";

export async function generateJSON<T>(
  prompt: string,
  system: string,
  temperature = 0.7
): Promise<T> {
  return azureGenerateJSON<T>(prompt, system, temperature);
}

const OCR_INSTRUCTION =
  "You are an OCR assistant for UPSC Mains handwritten answer sheets. " +
  "Extract the student's answer verbatim, preserving paragraph breaks and ordering. " +
  "Do not summarize, correct, rewrite, or add any commentary. " +
  "If the image is blank, unreadable, or contains no handwritten text, return an empty string.";

async function extractTextWithAzure(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!azureClient) {
    throw new Error("Azure OpenAI is not configured for OCR.");
  }

  const base64Data = fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const response = await azureClient.chat.completions.create(
    {
      model: chatDeployment,
      messages: [
        { role: "system", content: OCR_INSTRUCTION },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all handwritten text from this image:" },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_completion_tokens: 4096,
      temperature: 0,
    },
    { signal: AbortSignal.timeout(30000) }
  );

  return (response.choices[0]?.message?.content ?? "").trim();
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").trim();
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Use pdfjs-dist legacy build directly — pdf-parse v2 pulls in the standard
  // build which requires browser globals like DOMMatrix and fails in Node.
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const loadingTask = pdfjs.getDocument({
    data: uint8,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: false,
  });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .join(" ");
      pages.push(pageText);
      page.cleanup();
    }
    return pages.join("\n\n").trim();
  } finally {
    await doc.destroy().catch(() => {});
  }
}

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Extract plain text from an uploaded answer file. Routes by MIME type:
 *  - DOCX → mammoth
 *  - PDF  → pdf-parse
 *  - Image → Azure OpenAI vision OCR
 * Throws a clear error for unsupported types instead of leaking into vision API.
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const mt = (mimeType || "").toLowerCase();

  if (
    mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mt === "application/msword"
  ) {
    console.log("[OCR] DOCX → mammoth text extraction");
    return await extractTextFromDocx(fileBuffer);
  }

  if (mt === "application/pdf") {
    console.log("[OCR] PDF → pdf-parse text extraction");
    return await extractTextFromPdf(fileBuffer);
  }

  if (IMAGE_MIMES.has(mt)) {
    if (!azureClient) {
      throw new Error("Azure OpenAI is not configured for OCR.");
    }
    console.log("[OCR] Image → Azure OpenAI vision");
    const text = await extractTextWithAzure(fileBuffer, mt);
    console.log(`[OCR] Azure OK (${text.length} chars)`);
    return text;
  }

  throw new Error(
    `Unsupported file type for answer evaluation: ${mimeType || "unknown"}. Accepted: JPG, PNG, PDF, DOCX.`
  );
}
