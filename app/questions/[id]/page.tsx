import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import QuestionDetailClient from './QuestionDetailClient';

export const dynamic = 'force-dynamic';

type PublicQuestion = {
  id: string;
  mode?: 'prelims' | 'mains';
  year?: number | null;
  paper?: string | null;
  questionNum?: number | null;
  questionText: string;
  subject?: string | null;
  subSubject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  options?: Array<{ label: string; text: string }> | null;
  correctOption?: string | null;
  explanation?: string | null;
  structuredJson?: any;
  questionStructure?: any;
};

type QuestionDetailResponse = {
  status: 'success' | 'error';
  message?: string;
  data?: {
    question: PublicQuestion;
    mode: 'prelims' | 'mains';
  };
};

type QuestionsResponse = {
  status: 'success' | 'error';
  data?: {
    questions: PublicQuestion[];
  };
};

type PyqNavigation = {
  modes: Array<{
    key: 'prelims' | 'mains' | 'csat';
    label: string;
    years: Array<{ year: number; count: number }>;
  }>;
  years: Array<{ year: number; count: number }>;
};

type MetadataResponse = {
  status: 'success' | 'error';
  data?: PyqNavigation;
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string | string[] }>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeMode(value?: string): 'prelims' | 'mains' | undefined {
  const lower = value?.toLowerCase();
  return lower === 'mains' || lower === 'prelims' ? lower : undefined;
}

function truncate(text: string, max = 150) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

function titleFor(question: PublicQuestion, mode: 'prelims' | 'mains') {
  const pieces = [
    question.year ? `UPSC ${mode === 'prelims' ? 'Prelims' : 'Mains'} ${question.year}` : `UPSC ${mode}`,
    question.subject,
    question.topic,
  ].filter(Boolean);
  return `${pieces.join(' - ')} Question with Explanation | RiseWithJeet`;
}

async function fetchQuestion(id: string, mode?: 'prelims' | 'mains') {
  const qs = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  const res = await fetch(`${API_BASE_URL}/pyq/questions/${encodeURIComponent(id)}${qs}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch question ${id}: ${res.status}`);
  const json = (await res.json()) as QuestionDetailResponse;
  if (json.status !== 'success' || !json.data?.question) return null;
  return json.data;
}

async function fetchRelated(question: PublicQuestion, mode: 'prelims' | 'mains') {
  const query = new URLSearchParams();
  query.set('mode', mode);
  query.set('limit', '5');
  if (question.year) query.set('year', String(question.year));
  if (question.subject) query.set('subject', question.subject);
  const res = await fetch(`${API_BASE_URL}/pyq/questions?${query.toString()}`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res?.ok) return [];
  const json = (await res.json()) as QuestionsResponse;
  return (json.data?.questions || []).filter((item) => item.id !== question.id).slice(0, 4);
}

async function fetchPyqNavigation(): Promise<PyqNavigation> {
  const res = await fetch(`${API_BASE_URL}/pyq/metadata`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res?.ok) return { modes: [], years: [] };
  const json = (await res.json()) as MetadataResponse;
  return json.data || { modes: [], years: [] };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const search = await searchParams;
  const mode = normalizeMode(firstParam(search.mode));
  const detail = await fetchQuestion(id, mode).catch(() => null);
  if (!detail) {
    return {
      title: 'UPSC Question Not Found | RiseWithJeet',
      robots: { index: false, follow: false },
    };
  }

  const question = detail.question;
  const resolvedMode = detail.mode;
  const description = `${truncate(question.questionText, 130)} Free UPSC ${resolvedMode} PYQ with answer and explanation on RiseWithJeet.`;

  return {
    title: titleFor(question, resolvedMode),
    description,
    keywords: [
      'UPSC',
      'UPSC PYQ',
      'Previous Year Questions',
      question.subject,
      question.topic,
      question.year ? `UPSC ${question.year}` : undefined,
      resolvedMode,
    ].filter(Boolean) as string[],
    openGraph: {
      title: titleFor(question, resolvedMode),
      description,
      type: 'article',
    },
  };
}

export default async function QuestionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;
  const mode = normalizeMode(firstParam(search.mode));
  const detail = await fetchQuestion(id, mode);
  if (!detail) notFound();

  const [relatedQuestions, pyqNavigation] = await Promise.all([
    fetchRelated(detail.question, detail.mode),
    fetchPyqNavigation(),
  ]);
  const answerText =
    detail.question.correctOption ||
    detail.question.explanation ||
    detail.question.structuredJson?.explanation?.displayText ||
    undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: titleFor(detail.question, detail.mode),
    description: truncate(detail.question.questionText, 180),
    educationLevel: 'Graduate',
    provider: { '@type': 'Organization', name: 'RiseWithJeet' },
    hasPart: [
      {
        '@type': 'Question',
        text: detail.question.questionText,
        ...(answerText ? { acceptedAnswer: { '@type': 'Answer', text: answerText } } : {}),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <QuestionDetailClient
        question={detail.question}
        mode={detail.mode}
        relatedQuestions={relatedQuestions}
        pyqNavigation={pyqNavigation}
      />
    </>
  );
}
