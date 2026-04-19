import { invokeModelJSON, BedrockMessage } from "../config/llm";
import { extractTextFromFile } from "../config/gemini";
import { downloadFile, STORAGE_BUCKETS } from "../config/storage";
import prisma from "../config/database";

interface EvaluationResult {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback: string;
  metrics?: Array<{ label: string; value: number; maxValue: number }>;
}

interface QuestionContext {
  questionText: string;
  subject: string;
  marks: number;
  paper: string;
}

export interface EvaluationUpdate {
  score: number;
  maxScore: number;
  status: "evaluating" | "completed" | "failed";
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  detailedFeedback: string;
  evaluatedAt: Date | null;
}

/**
 * dbOps lets the generic evaluator work against any (attempt, evaluation)
 * table pair — MainsAttempt/MainsEvaluation, PyqMainsAttempt/PyqMainsEvaluation,
 * or MockTestMainsAttempt/MockTestMainsEvaluation. Callers inject the four
 * operations below and the engine stays schema-agnostic.
 */
export interface EvaluationDbOps {
  markEvaluating: (maxScore: number) => Promise<void>;
  saveAttemptText: (answerText: string, wordCount: number) => Promise<void>;
  saveEvaluation: (update: EvaluationUpdate) => Promise<void>;
}

/**
 * Run the Azure OpenAI evaluator on a piece of answer text. Shared by both
 * the typed-answer path and the handwritten OCR path so the rubric, prompt
 * and fallback behavior stay in one place.
 */
async function runAzureEvaluation(
  answerText: string,
  question: QuestionContext,
  ocrNote: boolean
): Promise<EvaluationResult> {
  const messages: BedrockMessage[] = [
    {
      role: "user",
      content: `Evaluate this UPSC Mains answer for the question below.

Question (${question.paper} - ${question.subject}, ${question.marks} marks):
"${question.questionText}"

Student's Answer:
"""
${answerText}
"""

${ocrNote
  ? "This answer was OCR-extracted from a handwritten submission; grade the content rigorously but be lenient about minor spelling artifacts from OCR.\n\n"
  : ""}SCORING RUBRIC (strict, evidence-based):
1. Structure & Organization — introduction, body, conclusion
2. Content Depth & Accuracy — correct facts, concepts, frameworks
3. Balance of Perspectives — multiple viewpoints where relevant
4. Use of Examples & Facts — data, case studies, committee reports
5. Clarity & Language Quality — grammar, flow, precision
6. Relevance to Question Asked — directly addresses the demand

CRITICAL RULES — FOLLOW EXACTLY:
- ALWAYS base your scoring ONLY on the actual text inside the triple quotes above. NEVER invent or assume content the student did not write. NEVER award strengths that are not demonstrably present in the answer text.
- If the answer is OFF-TOPIC, IRRELEVANT, GIBBERISH, an unrelated document (work log, personal notes, a different subject, etc.), or clearly does not address the question: the score MUST be 0-15% of max marks. State explicitly in detailedFeedback that the answer is off-topic. strengths SHOULD be an empty list (unless there is something genuinely good). improvements MUST start with "Answer does not address the question — rewrite focusing on <the exact demand of the question>".
- If the answer is VERY SHORT (under 50 words) or INCOMPLETE: cap the score at 30% of max marks and say so.
- If the answer is well-written but only PARTIALLY addresses the question: cap at 60% of max marks and flag the gap.
- Only award high scores (>75%) for answers that are ON-TOPIC, well-structured, substantively correct, and multi-dimensional.
- Every item in "strengths" must quote or paraphrase a specific line/idea the student actually wrote. Do NOT list generic praise.
- Every item in "improvements" must be specific to what this answer got wrong or missed, not generic tips.

Return ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{
  "score": <integer 0-${question.marks}>,
  "strengths": ["..."],
  "improvements": ["..."],
  "suggestions": ["..."],
  "detailedFeedback": "2-3 short paragraphs grounded in the student's actual text",
  "metrics": [
    {"label": "Structure", "value": <0-10>, "maxValue": 10},
    {"label": "Content", "value": <0-10>, "maxValue": 10},
    {"label": "Examples", "value": <0-10>, "maxValue": 10},
    {"label": "Language", "value": <0-10>, "maxValue": 10},
    {"label": "Relevance", "value": <0-10>, "maxValue": 10}
  ]
}`,
    },
  ];

  const system =
    "You are a strict UPSC Mains answer evaluator. You grade ONLY the text the student actually wrote. You never hallucinate content, never praise things not present in the answer, and heavily penalise off-topic or irrelevant submissions. Always return valid JSON only — no extra prose.";

  return invokeModelJSON<EvaluationResult>(messages, {
    system,
    maxTokens: 2048,
    temperature: 0.3,
    serviceName: "answerEvaluator",
  });
}

/**
 * Schema-agnostic mains evaluator. Handles the OCR-if-needed → Azure grade →
 * persist flow, calling into `dbOps` so the caller decides which Prisma
 * tables get written. Used by Daily Answer, PYQ Mains and Mock Test Mains.
 */
export async function evaluateAnswerGeneric(params: {
  attemptId: string;
  answerText: string | null;
  fileUrl: string | null;
  question: QuestionContext;
  dbOps: EvaluationDbOps;
}): Promise<void> {
  const { attemptId, answerText, fileUrl, question, dbOps } = params;

  try {
    console.log(`[eval] attempt ${attemptId} → markEvaluating (marks=${question.marks})`);
    await dbOps.markEvaluating(question.marks);
    console.log(`[eval] attempt ${attemptId} → markEvaluating OK`);

    let textToGrade = answerText?.trim() || "";
    let viaOcr = false;

    // Handwritten path: OCR the file into text, then reuse the text path.
    if (!textToGrade && fileUrl) {
      console.log(`[eval] attempt ${attemptId} → OCR path: downloading file from ${fileUrl}`);
      const { buffer, contentType } = await downloadFile(
        STORAGE_BUCKETS.ANSWER_UPLOADS,
        fileUrl
      );
      console.log(`[eval] attempt ${attemptId} → download OK (${buffer.length} bytes, ${contentType})`);

      console.log(`[eval] attempt ${attemptId} → calling Gemini OCR...`);
      const ocrText = await extractTextFromFile(buffer, contentType);
      console.log(`[eval] attempt ${attemptId} → OCR OK (${ocrText.length} chars extracted)`);

      if (ocrText.length < 20) {
        console.log(`[eval] attempt ${attemptId} → OCR text too short (<20 chars), marking unreadable`);
        await dbOps.saveEvaluation({
          score: 0,
          maxScore: question.marks,
          status: "completed",
          strengths: [],
          improvements: [
            "We couldn't read the handwriting from your uploaded file.",
            "Retake the photo in bright, even lighting with the page flat.",
            "Make sure the whole answer is in frame and in focus.",
          ],
          suggestions: [
            "Try a high-resolution scan or PDF if possible.",
            "Alternatively, type your answer directly for an instant evaluation.",
          ],
          detailedFeedback:
            "Your uploaded file was received, but our OCR could not extract a readable answer from it. This usually happens with blurry photos, low light, or very faint pencil marks. Please retake the photo with good lighting and clear handwriting, then resubmit — or type the answer directly.",
          evaluatedAt: new Date(),
        });
        return;
      }

      textToGrade = ocrText;
      viaOcr = true;

      const wordCount = textToGrade.split(/\s+/).filter(Boolean).length;
      console.log(`[eval] attempt ${attemptId} → saving OCR text (${wordCount} words)`);
      await dbOps.saveAttemptText(textToGrade, wordCount);
      console.log(`[eval] attempt ${attemptId} → saveAttemptText OK`);
    }

    if (!textToGrade) {
      throw new Error("No answer text or file URL provided");
    }

    console.log(`[eval] attempt ${attemptId} → calling Azure grading (${textToGrade.length} chars, ocr=${viaOcr})...`);
    const result = await runAzureEvaluation(textToGrade, question, viaOcr);
    console.log(`[eval] attempt ${attemptId} → Azure OK (score: ${result.score}/${question.marks})`);

    await dbOps.saveEvaluation({
      score: Math.min(result.score, question.marks),
      maxScore: question.marks,
      status: "completed",
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      suggestions: result.suggestions || [],
      detailedFeedback: result.detailedFeedback || "",
      evaluatedAt: new Date(),
    });
    console.log(`[eval] attempt ${attemptId} → evaluation saved ✓`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : String(error);
    console.error(`[eval] attempt ${attemptId} FAILED:`, errStack);

    // Honest failure: no fake score, clear guidance to the user. We still mark
    // the evaluation as "completed" so the frontend navigates off the spinner.
    const userFacingReason = classifyEvalError(errMsg);
    try {
      await dbOps.saveEvaluation({
        score: 0,
        maxScore: question.marks,
        status: "completed",
        strengths: [],
        improvements: [userFacingReason.improvement],
        suggestions: [userFacingReason.suggestion],
        detailedFeedback: userFacingReason.detail,
        evaluatedAt: new Date(),
      });
    } catch (updateError) {
      console.error("[eval] Failed to save failure evaluation:", updateError);
    }
  }
}

function classifyEvalError(errMsg: string): {
  improvement: string;
  suggestion: string;
  detail: string;
} {
  const msg = errMsg.toLowerCase();
  if (msg.includes("unsupported file type") || msg.includes("unsupported mime")) {
    return {
      improvement: "The uploaded file type is not supported for evaluation.",
      suggestion: "Upload a JPG or PNG photo of your handwritten answer, a PDF scan, or a DOCX of typed text.",
      detail:
        "We couldn't evaluate this file because its format isn't supported. Please re-upload as JPG, PNG, PDF, or DOCX — or type your answer directly.",
    };
  }
  if (msg.includes("ocr") || msg.includes("image_url") || msg.includes("vision")) {
    return {
      improvement: "We couldn't read your handwriting from the uploaded image.",
      suggestion: "Retake the photo in bright, even lighting with the page flat and fully in frame.",
      detail:
        "Our OCR could not extract a readable answer from your upload. This usually happens with blurry photos, low light, or very faint pencil marks. Please resubmit with a clearer image or type your answer.",
    };
  }
  return {
    improvement: "AI evaluation could not be completed for this submission.",
    suggestion: "Please try resubmitting your answer.",
    detail: `Evaluation failed: ${errMsg}. No score has been assigned. Please resubmit your answer to try again.`,
  };
}

/**
 * Daily Answer wrapper — the existing callsite. Wires up Prisma's
 * mainsAttempt / mainsEvaluation tables as the dbOps target.
 */
export async function evaluateAnswer(
  attemptId: string,
  answerText: string | null,
  question: QuestionContext,
  fileUrl?: string | null
): Promise<void> {
  const dbOps: EvaluationDbOps = {
    markEvaluating: async (maxScore) => {
      await prisma.mainsEvaluation.upsert({
        where: { attemptId },
        create: {
          attemptId,
          score: 0,
          maxScore,
          status: "evaluating",
          strengths: [],
          improvements: [],
          suggestions: [],
        },
        // Reset prior eval output so stale strengths/feedback from a previous
        // submission on this attempt don't leak into the new results.
        update: {
          status: "evaluating",
          score: 0,
          maxScore,
          strengths: [],
          improvements: [],
          suggestions: [],
          detailedFeedback: null,
          evaluatedAt: null,
        },
      });
    },
    saveAttemptText: async (text, wordCount) => {
      await prisma.mainsAttempt.update({
        where: { id: attemptId },
        data: { answerText: text, wordCount },
      });
    },
    saveEvaluation: async (update) => {
      await prisma.mainsEvaluation.update({
        where: { attemptId },
        data: update,
      });
    },
  };

  await evaluateAnswerGeneric({
    attemptId,
    answerText,
    fileUrl: fileUrl ?? null,
    question,
    dbOps,
  });
}
