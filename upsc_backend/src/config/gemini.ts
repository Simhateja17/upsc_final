import { GoogleGenAI } from "@google/genai";
import { azureClient, chatDeployment } from "./azure";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[Gemini] GEMINI_API_KEY is not set — Gemini features will be unavailable.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateJSON<T>(
  prompt: string,
  system: string,
  temperature = 0.7
): Promise<T> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Set GEMINI_API_KEY to use this feature.");
  }
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  return JSON.parse(text) as T;
}

const OCR_INSTRUCTION =
  "You are an OCR assistant for UPSC Mains handwritten answer sheets. " +
  "Extract the student's answer verbatim, preserving paragraph breaks and ordering. " +
  "Do not summarize, correct, rewrite, or add any commentary. " +
  "If the image is blank, unreadable, or contains no handwritten text, return an empty string.";

/**
 * OCR via Azure OpenAI vision (GPT-5.4-mini / GPT-4o support image inputs).
 * Used as the primary OCR method since it's on a paid plan.
 */
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

/**
 * OCR via Gemini (free tier — may hit quota limits).
 */
async function extractTextWithGemini(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Set GEMINI_API_KEY to use this feature.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: OCR_INSTRUCTION },
          {
            inlineData: {
              data: fileBuffer.toString("base64"),
              mimeType,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.0,
      httpOptions: { timeout: 15000 },
    },
  });

  return (response.text ?? "").trim();
}

/**
 * OCR / vision extraction: reads a handwritten answer sheet (image or PDF)
 * and returns the extracted plain text. Tries Azure OpenAI first (paid),
 * falls back to Gemini if Azure fails.
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  // Primary: Azure OpenAI vision (paid, reliable)
  if (azureClient) {
    try {
      console.log("[OCR] Trying Azure OpenAI vision...");
      const text = await extractTextWithAzure(fileBuffer, mimeType);
      console.log(`[OCR] Azure OK (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn("[OCR] Azure vision failed, trying Gemini fallback:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback: Gemini (free tier — may be quota-exhausted)
  if (ai) {
    console.log("[OCR] Trying Gemini...");
    const text = await extractTextWithGemini(fileBuffer, mimeType);
    console.log(`[OCR] Gemini OK (${text.length} chars)`);
    return text;
  }

  throw new Error("No OCR provider available — configure Azure OpenAI or Gemini API key.");
}
