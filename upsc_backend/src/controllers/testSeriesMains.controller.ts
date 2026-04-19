import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import {
  evaluateAnswerGeneric,
  EvaluationDbOps,
} from "../services/answerEvaluator";
import { uploadFile, STORAGE_BUCKETS } from "../config/storage";

function buildDbOps(attemptId: string): EvaluationDbOps {
  return {
    markEvaluating: async (maxScore) => {
      await prisma.testSeriesMainsEvaluation.upsert({
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
      await prisma.testSeriesMainsAttempt.update({
        where: { id: attemptId },
        data: { answerText: text, wordCount },
      });
    },
    saveEvaluation: async (update) => {
      await prisma.testSeriesMainsEvaluation.update({
        where: { attemptId },
        data: update,
      });
    },
  };
}

async function kickoffEvaluation(
  attemptId: string,
  answerText: string | null,
  fileUrl: string | null,
  question: { questionText: string; subject: string; paper: string; marks: number }
) {
  console.log(`[Test Series Mains Evaluation] starting for attempt ${attemptId}`);
  evaluateAnswerGeneric({
    attemptId,
    answerText,
    fileUrl,
    question,
    dbOps: buildDbOps(attemptId),
  }).catch((err) =>
    console.error("[Test Series Mains Evaluation] error:", err)
  );
}

/**
 * GET /api/test-series/:seriesId/mains-question
 * Fetch the next (or only) mains question for a series. Returns the first
 * question ordered by `order`. Enrollment is required.
 */
export const getMainsQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const seriesId = req.params.seriesId as string;

    const series = await prisma.testSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series || !series.isActive) {
      return res
        .status(404)
        .json({ status: "error", message: "Test series not found" });
    }

    const enrollment = await prisma.userSeriesEnrollment.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });
    if (!enrollment) {
      return res
        .status(403)
        .json({ status: "error", message: "You are not enrolled in this series" });
    }

    const question = await prisma.testSeriesMainsQuestion.findFirst({
      where: { seriesId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "No mains question configured for this series yet",
      });
    }

    res.json({
      status: "success",
      data: {
        id: question.id,
        questionText: question.questionText,
        subject: question.subject,
        paper: question.paper,
        marks: question.marks,
        series: {
          id: series.id,
          title: series.title,
          examMode: series.examMode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/test-series/:seriesId/mains-submit
 * Body: { questionId, answerText? } or multipart with `file`.
 */
export const submitMainsAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const seriesId = req.params.seriesId as string;

    const rawQId = req.body?.questionId;
    const questionId: string | undefined =
      typeof rawQId === "string" ? rawQId : undefined;
    if (!questionId) {
      return res
        .status(400)
        .json({ status: "error", message: "questionId is required" });
    }

    const series = await prisma.testSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series) {
      return res
        .status(404)
        .json({ status: "error", message: "Test series not found" });
    }

    const enrollment = await prisma.userSeriesEnrollment.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });
    if (!enrollment) {
      return res
        .status(403)
        .json({ status: "error", message: "You are not enrolled in this series" });
    }

    const question = await prisma.testSeriesMainsQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question || question.seriesId !== seriesId) {
      return res
        .status(404)
        .json({ status: "error", message: "Question not found for this series" });
    }

    const rawAnswer = req.body?.answerText;
    const answerText: string | undefined =
      typeof rawAnswer === "string" ? rawAnswer : undefined;
    let fileUrl: string | null = null;

    if (req.file) {
      const fileName = `${userId}/test-series/${Date.now()}_${req.file.originalname}`;
      await uploadFile(
        STORAGE_BUCKETS.ANSWER_UPLOADS,
        fileName,
        req.file.buffer,
        req.file.mimetype
      );
      fileUrl = fileName;
    }

    if (!fileUrl && (!answerText || answerText.trim().length === 0)) {
      return res.status(400).json({
        status: "error",
        message: "Provide either answerText or a file upload",
      });
    }

    const wordCount = answerText
      ? answerText.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const attempt = await prisma.testSeriesMainsAttempt.create({
      data: {
        userId,
        seriesId,
        questionId,
        answerText: answerText || null,
        fileUrl,
        wordCount,
        submittedAt: new Date(),
      },
    });

    kickoffEvaluation(
      attempt.id,
      answerText || null,
      fileUrl,
      {
        questionText: question.questionText,
        subject: question.subject,
        paper: question.paper,
        marks: question.marks,
      }
    );

    await prisma.userActivity.create({
      data: {
        userId,
        type: "test_series",
        title: "Submitted Test Series Mains Answer",
        description: `${series.title} - ${question.subject}`,
      },
    });

    res.json({
      status: "success",
      data: { attemptId: attempt.id, status: "evaluating" },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/test-series/:seriesId/mains-evaluation-status?attemptId=...
 */
export const getMainsEvaluationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const attemptId =
      typeof req.query.attemptId === "string" ? req.query.attemptId : "";
    if (!attemptId) {
      return res
        .status(400)
        .json({ status: "error", message: "attemptId is required" });
    }

    const attempt = await prisma.testSeriesMainsAttempt.findUnique({
      where: { id: attemptId },
      include: { evaluation: true },
    });
    if (!attempt || attempt.userId !== userId) {
      return res
        .status(404)
        .json({ status: "error", message: "Attempt not found" });
    }

    res.json({
      status: "success",
      data: {
        attemptId: attempt.id,
        evaluationStatus: attempt.evaluation?.status || "pending",
        isComplete: attempt.evaluation?.status === "completed",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/test-series/:seriesId/mains-results?attemptId=...
 */
export const getMainsResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const attemptId =
      typeof req.query.attemptId === "string" ? req.query.attemptId : "";
    if (!attemptId) {
      return res
        .status(400)
        .json({ status: "error", message: "attemptId is required" });
    }

    const attempt = await prisma.testSeriesMainsAttempt.findUnique({
      where: { id: attemptId },
      include: { evaluation: true, question: true, series: true },
    });
    if (!attempt || attempt.userId !== userId) {
      return res
        .status(404)
        .json({ status: "error", message: "Attempt not found" });
    }
    if (!attempt.evaluation) {
      return res
        .status(404)
        .json({ status: "error", message: "No evaluation results found" });
    }

    res.json({
      status: "success",
      data: {
        score: attempt.evaluation.score,
        maxScore: attempt.evaluation.maxScore,
        strengths: attempt.evaluation.strengths,
        improvements: attempt.evaluation.improvements,
        suggestions: attempt.evaluation.suggestions,
        detailedFeedback: attempt.evaluation.detailedFeedback,
        wordCount: attempt.wordCount,
        submittedAt: attempt.submittedAt,
        answerText: attempt.answerText,
        question: {
          id: attempt.question.id,
          questionText: attempt.question.questionText,
          subject: attempt.question.subject,
          paper: attempt.question.paper,
          marks: attempt.question.marks,
        },
        series: {
          id: attempt.series.id,
          title: attempt.series.title,
          examMode: attempt.series.examMode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/test-series/:seriesId/mains-questions
 * Admin: create a mains question for a series.
 */
export const createMainsQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user!.role !== "admin") {
      return res
        .status(403)
        .json({ status: "error", message: "Admin access required" });
    }

    const seriesId = req.params.seriesId as string;
    const { questionText, subject, paper, marks, order } = req.body || {};

    if (!questionText || typeof questionText !== "string") {
      return res
        .status(400)
        .json({ status: "error", message: "questionText is required" });
    }
    if (!subject || typeof subject !== "string") {
      return res
        .status(400)
        .json({ status: "error", message: "subject is required" });
    }

    const series = await prisma.testSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series) {
      return res
        .status(404)
        .json({ status: "error", message: "Test series not found" });
    }

    const question = await prisma.testSeriesMainsQuestion.create({
      data: {
        seriesId,
        questionText,
        subject,
        paper: typeof paper === "string" && paper ? paper : "GS-I",
        marks: typeof marks === "number" && marks > 0 ? marks : 15,
        order: typeof order === "number" ? order : 0,
      },
    });

    res.status(201).json({ status: "success", data: question });
  } catch (error) {
    next(error);
  }
};
