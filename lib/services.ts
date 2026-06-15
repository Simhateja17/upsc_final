import api, { ApiRequestError } from './api';
import { getStoredTokens, storeTokens } from './auth';
import { supabase } from './supabase';

function getToken(): string | undefined {
  const tokens = getStoredTokens();
  return tokens?.accessToken ?? undefined;
}

function authConfig() {
  return { token: getToken() };
}

async function freshAuthConfig() {
  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session?.access_token) {
    storeTokens(data.session.access_token, data.session.refresh_token ?? '');
    return { token: data.session.access_token };
  }

  return authConfig();
}

async function syncCurrentSessionWithBackend() {
  const { data, error } = await supabase.auth.getSession();
  const session = data.session;

  if (error || !session?.access_token) return null;

  storeTokens(session.access_token, session.refresh_token ?? '');
  await api.post('/auth/callback', {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? '',
  });

  return { token: session.access_token };
}

// ==================== Jeet AI Mentor Chat ====================

export const jeetAIService = {
  sendMessage: (message: string, conversationId?: string) =>
    api.post<{ conversationId: string; reply: string }>(
      '/ai/chat',
      { message, conversationId },
      { ...authConfig(), timeout: 120000 }
    ),

  getConversations: () =>
    api.get<{
      today: { id: string; title: string; updatedAt: string }[];
      yesterday: { id: string; title: string; updatedAt: string }[];
      earlier: { id: string; title: string; updatedAt: string }[];
    }>('/ai/conversations', authConfig()),

  getConversation: (conversationId: string) =>
    api.get<{
      id: string;
      title: string;
      messages: { id: string; role: string; content: string; createdAt: string }[];
    }>(`/ai/conversations/${conversationId}`, authConfig()),

  deleteConversation: (conversationId: string) =>
    api.delete<{ message: string }>(`/ai/conversations/${conversationId}`, authConfig()),
};

// ==================== Dashboard ====================

export const dashboardService = {
  getDashboard: () => api.get<any>('/user/dashboard', authConfig()),
  getStreak: () => api.get<any>('/user/streak', authConfig()),
  getActivity: (limit = 10) => api.get<any>(`/user/activity?limit=${limit}`, authConfig()),
  getPerformance: () => api.get<any>('/user/performance', authConfig()),
  getPracticeStats: () => api.get<any>('/user/practice-stats', authConfig()),
  getTestAnalytics: async () => {
    const config = { ...(await freshAuthConfig()), timeout: 5000 };

    try {
      return await api.get<any>('/user/test-analytics', config);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!/auth/i.test(message)) throw err;

      const syncedConfig = await syncCurrentSessionWithBackend();
      if (!syncedConfig) throw err;

      return api.get<any>('/user/test-analytics', { ...syncedConfig, timeout: 5000 });
    }
  },
};

// ==================== Daily MCQ ====================

export const dailyMcqService = {
  getToday: () => api.get<any>('/daily-mcq/today', authConfig()),
  getQuestions: () => api.get<any>('/daily-mcq/today/questions', authConfig()),
  submit: (answers: any[], timeTaken: number) =>
    api.post<any>('/daily-mcq/today/submit', { answers, timeTaken }, authConfig()),
  getResults: () => api.get<any>('/daily-mcq/today/results', authConfig()),
  getReview: () => api.get<any>('/daily-mcq/today/review', authConfig()),
  getRecommendations: () => api.get<any>('/daily-mcq/today/recommendations', authConfig()),
};

// ==================== Daily Answer ====================

export const dailyAnswerService = {
  getToday: () => api.get<any>('/daily-answer/today', authConfig()),
  getFullQuestion: (date?: string) =>
    api.get<any>(`/daily-answer/today/question${date ? `?date=${encodeURIComponent(date)}` : ''}`, authConfig()),
  submitText: (answerText: string, date?: string) =>
    api.post<{ status: string; data?: { attemptId: string; status: string }; message?: string }>(
      `/daily-answer/today/submit-text${date ? `?date=${encodeURIComponent(date)}` : ''}`,
      { answerText },
      authConfig()
    ),
  upload: (fileUrl: string, date?: string) =>
    api.post<any>(`/daily-answer/today/upload${date ? `?date=${encodeURIComponent(date)}` : ''}`, { fileUrl }, authConfig()),
  uploadFile: async (file: File, date?: string): Promise<{ status: string; data?: { attemptId: string; status: string }; message?: string }> => {
    const fd = new FormData();
    fd.append('file', file);

    const token = getToken();
    const suffix = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-answer/today/upload${suffix}`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new ApiRequestError(json.message || 'Upload failed', res.status, json);
    return json;
  },
  uploadFiles: async (files: File[], date?: string): Promise<{ status: string; data?: { attemptId: string; status: string }; message?: string }> => {
    const fd = new FormData();
    files.forEach((file) => fd.append('file', file));

    const token = getToken();
    const suffix = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-answer/today/upload${suffix}`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new ApiRequestError(json.message || 'Upload failed', res.status, json);
    return json;
  },
  getEvaluationStatus: (attemptId?: string, date?: string) => {
    const qs: string[] = [];
    if (attemptId) qs.push(`attemptId=${encodeURIComponent(attemptId)}`);
    if (date) qs.push(`date=${encodeURIComponent(date)}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return api.get<any>(`/daily-answer/today/evaluation-status${suffix}`, authConfig());
  },
  getResults: (attemptId?: string, date?: string) => {
    const qs: string[] = [];
    if (attemptId) qs.push(`attemptId=${encodeURIComponent(attemptId)}`);
    if (date) qs.push(`date=${encodeURIComponent(date)}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return api.get<any>(`/daily-answer/today/results${suffix}`, authConfig());
  },
  getCalendar: (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
    const qs: string[] = [];
    if (params?.from) qs.push(`from=${encodeURIComponent(params.from)}`);
    if (params?.to) qs.push(`to=${encodeURIComponent(params.to)}`);
    if (params?.page) qs.push(`page=${params.page}`);
    if (params?.limit) qs.push(`limit=${params.limit}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return api.get<any>(`/daily-answer/calendar${suffix}`, authConfig());
  },
};

// ==================== Editorials ====================

export const editorialService = {
  getToday: (source?: string, date?: string) => {
    const qs: string[] = [];
    if (source && source !== 'all') qs.push(`source=${encodeURIComponent(source)}`);
    if (date) qs.push(`date=${encodeURIComponent(date)}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return api.get<any>(`/editorials/today${suffix}`, authConfig());
  },
  getLiveNews: (source?: string, date?: string) => {
    const qs: string[] = [];
    if (source && source !== 'all') qs.push(`source=${encodeURIComponent(source)}`);
    if (date) qs.push(`date=${encodeURIComponent(date)}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return api.get<any>(`/editorials/live-news${suffix}`, authConfig());
  },
  getAvailability: (source?: string, month?: string) => {
    const qs: string[] = [];
    if (source && source !== 'all') qs.push(`source=${encodeURIComponent(source)}`);
    if (month) qs.push(`month=${encodeURIComponent(month)}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return api.get<any>(`/editorials/availability${suffix}`, authConfig());
  },
  getById: (id: string) => api.get<any>(`/editorials/${id}`, authConfig()),
  markRead: (id: string) => api.post<any>(`/editorials/${id}/mark-read`, {}, authConfig()),
  toggleSave: (id: string) => api.post<any>(`/editorials/${id}/save`, {}, authConfig()),
  summarize: (id: string) => api.post<any>(`/editorials/${id}/summarize`, {}, authConfig()),
  syncNews: () => api.post<any>('/editorials/sync-news', {}, authConfig()),
  getStats: () => api.get<any>('/editorials/stats', authConfig()),
};

// ==================== Mock Tests ====================

export const mockTestService = {
  getSubjects: () => api.get<any>('/mock-tests/subjects'),
  getConfig: () => api.get<any>('/mock-tests/config'),
  getPlatformStats: () => api.get<any>('/mock-tests/platform-stats'),
  generate: (config: { source: string; subject: string; examMode: string; paperType?: string; optionalSubject?: string; questionCount: number; difficulty: string }) =>
    api.post<any>('/mock-tests/generate', config, authConfig()),
  getQuestions: (testId: string) => api.get<any>(`/mock-tests/${testId}/questions`, authConfig()),
  submit: (testId: string, answers: Record<string, string>, timeTaken: number) =>
    api.post<any>(`/mock-tests/${testId}/submit`, { answers, timeTaken }, authConfig()),
  saveProgress: (testId: string, answers: Record<string, string>) =>
    api.put<any>(`/mock-tests/${testId}/save-progress`, { answers }, authConfig()),
  getResults: (testId: string) => api.get<any>(`/mock-tests/${testId}/results`, authConfig()),
  getRecommendations: (testId: string) => api.get<any>(`/mock-tests/${testId}/recommendations`, authConfig()),

  // Mains AI evaluation
  submitMainsAnswer: async (
    testId: string,
    questionId: string,
    opts: { answerText?: string; file?: File }
  ): Promise<{ status: string; data?: { attemptId: string; status: string }; message?: string }> => {
    const fd = new FormData();
    fd.append('mockTestQuestionId', questionId);
    if (opts.answerText) fd.append('answerText', opts.answerText);
    if (opts.file) fd.append('file', opts.file);

    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/mock-tests/${testId}/mains-submit`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new ApiRequestError(json.message || 'Submit failed', res.status, json);
    return json;
  },
  getMainsEvaluationStatus: (testId: string, attemptId: string) =>
    api.get<any>(
      `/mock-tests/${testId}/mains-evaluation-status?attemptId=${encodeURIComponent(attemptId)}`,
      authConfig()
    ),
  getMainsResults: (testId: string, attemptId: string) =>
    api.get<any>(
      `/mock-tests/${testId}/mains-results?attemptId=${encodeURIComponent(attemptId)}`,
      authConfig()
    ),
};

// ==================== Study Planner ====================

export const studyPlannerService = {
  getTodayTasks: (date?: string) =>
    api.get<any>(`/study-plan/today${date ? `?date=${encodeURIComponent(date)}` : ''}`, authConfig()),
  createTask: (task: { title: string; description?: string; subject?: string; type?: string; date?: string; startTime?: string; endTime?: string; duration?: number; actualDuration?: number }) =>
    api.post<any>('/study-plan/tasks', task, authConfig()),
  updateTask: (id: string, updates: { title?: string; description?: string; subject?: string; type?: string; date?: string; startTime?: string; endTime?: string; duration?: number; actualDuration?: number; isCompleted?: boolean }) =>
    api.put<any>(`/study-plan/tasks/${id}`, updates, authConfig()),
  deleteTask: (id: string) => api.delete<any>(`/study-plan/tasks/${id}`, authConfig()),
  getStreak: () => api.get<any>('/study-plan/streak', authConfig()),
  getWeeklyGoals: () => api.get<any>('/study-plan/weekly-goals', authConfig()),
  saveWeeklyGoals: (goals: { title: string; completed: boolean }[]) =>
    api.put<any>('/study-plan/weekly-goals', { goals }, authConfig()),
  getSyllabusCoverage: () => api.get<any>('/study-plan/syllabus-coverage', authConfig()),
  getMonthlyActivity: (year: number, month: number) =>
    api.get<any>(`/study-plan/monthly-activity?year=${year}&month=${month}`, authConfig()),
  getCalendarSyncStatus: () =>
    api.get<any>('/study-plan/calendar-sync/status', authConfig()),
  getGoogleCalendarAuthUrl: () =>
    api.get<{ url: string }>('/study-plan/calendar-sync/google/auth-url', authConfig()),
  completeGoogleCalendarCallback: (code: string, state: string) =>
    api.post<any>('/study-plan/calendar-sync/google/callback', { code, state }, authConfig()),
  updateCalendarSync: (enabled: boolean) =>
    api.put<any>('/study-plan/calendar-sync', { enabled }, authConfig()),
};

// ==================== Library ====================

export const libraryService = {
  getSubjects: () => api.get<any>('/library/subjects', authConfig()),
  getChapters: (subjectId: string) => api.get<any>(`/library/subjects/${subjectId}/chapters`, authConfig()),
  getDownloadUrl: (chapterId: string) => api.get<any>(`/library/download/${chapterId}`, authConfig()),
  getMaterialDownloadUrl: (materialId: string) => api.get<any>(`/library/download/material/${materialId}`, authConfig()),
  getMaterialViewPages: (materialId: string, maxPages = 50) =>
    api.get<any>(`/library/view/material/${materialId}/pages?maxPages=${maxPages}`, { ...authConfig(), timeout: 120000 }),
};

// ==================== Pricing & Mentorship ====================

export const pricingService = {
  getPlans: () => api.get<any>('/pricing/plans'),
  getMentorshipSeats: () => api.get<any>('/mentorship/seats'),
  bookCall: (data: { name: string; email: string; phone?: string; message?: string }) =>
    api.post<any>('/mentorship/book-call', data, authConfig()),
  getTestimonials: () => api.get<any>('/mentorship/testimonials'),
  createOrder: (data: { itemType: string; itemId: string; itemName: string; amount: number }) =>
    api.post<any>('/pricing/orders', data, authConfig()),
};

export const billingService = {
  createRazorpayOrder: (data:
    | { planKey: 'aspire' | 'rise' | 'ascent'; cycle: 'monthly' | 'quarterly' | 'yearly' }
    | { itemType: 'test_series'; itemId: string }
  ) =>
    api.post<any>('/create-order', data, authConfig()),
  verifyRazorpayPayment: (data: {
    paymentId: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => api.post<any>('/verify-payment', data, authConfig()),
  markRazorpayPaymentFailed: (data: { paymentId: string; status: 'failed'; failureReason?: string }) =>
    api.post<any>('/verify-payment', data, authConfig()),
  createRazorpaySubscription: (data: {
    planKey: 'aspire' | 'rise' | 'ascent';
    cycle: 'monthly' | 'quarterly' | 'yearly';
    couponCode?: string;
  }) => api.post<any>('/billing/subscriptions/create', data, authConfig()),
  verifyRazorpaySubscription: (data: {
    subscriptionId: string;
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => api.post<any>('/billing/subscriptions/verify', data, authConfig()),
  getBillingSubscription: () => api.get<any>('/billing/subscription', authConfig()),
  cancelRazorpaySubscription: (id: string) => api.post<any>(`/billing/subscriptions/${id}/cancel`, {}, authConfig()),
  pauseRazorpaySubscription: (id: string) => api.post<any>(`/billing/subscriptions/${id}/pause`, {}, authConfig()),
  resumeRazorpaySubscription: (id: string) => api.post<any>(`/billing/subscriptions/${id}/resume`, {}, authConfig()),
};

export const entitlementService = {
  getMyEntitlements: () => api.get<any>('/entitlements/me', authConfig()),
};

// ==================== Jeet AI Mentor Chat ====================

export const aiService = {
  chat: (message: string, conversationId?: string) =>
    api.post<any>('/ai/chat', { message, conversationId }, authConfig()),
  getConversations: () => api.get<any>('/ai/conversations', authConfig()),
  getConversation: (conversationId: string) =>
    api.get<any>(`/ai/conversations/${conversationId}`, authConfig()),
  deleteConversation: (conversationId: string) =>
    api.delete<any>(`/ai/conversations/${conversationId}`, authConfig()),
};

// ==================== Mental Health ====================

export const mentalHealthService = {
  saveCheckIn: (data: { mood: string; energy: number; note?: string }) =>
    api.post<any>('/mental-health/check-in', data, authConfig()),
  getCheckIns: (days?: number) =>
    api.get<any>(`/mental-health/check-ins${days ? `?days=${days}` : ''}`, authConfig()),
  getStreak: () => api.get<any>('/mental-health/streak', authConfig()),
  saveToolSession: (data: { toolType: string; duration: number; completed?: boolean }) =>
    api.post<any>('/mental-health/tool-session', data, authConfig()),
  getToolStats: () => api.get<any>('/mental-health/tool-stats', authConfig()),
  getDailyContent: () => api.get<any>('/mental-health/daily-content', authConfig()),
  getStressIndex: (days?: number) =>
    api.get<any>(`/mental-health/stress-index${days ? `?days=${days}` : ''}`, authConfig()),
  saveJournalEntry: (data: { type: string; text: string; moodEmoji?: string }) =>
    api.post<any>('/mental-health/journal', data, authConfig()),
  getJournalEntries: (days?: number) =>
    api.get<any>(`/mental-health/journal${days ? `?days=${days}` : ''}`, authConfig()),
  deleteJournalEntry: (id: string) =>
    api.delete<any>(`/mental-health/journal/${id}`, authConfig()),
};

// ==================== CMS (Public) ====================

export const cmsService = {
  getPageContent: (slug: string) => api.get<any>(`/cms/${encodeURIComponent(slug)}`),
};

// ==================== PYQ (Public) ====================

export const pyqService = {
  getQuestions: (params?: {
    mode?: 'prelims' | 'mains';
    year?: number;
    years?: number[];
    yearFrom?: number;
    yearTo?: number;
    subject?: string;
    subSubject?: string;
    topic?: string | string[];
    paper?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.years && params.years.length > 0) {
      params.years.forEach((y) => query.append('years', String(y)));
    } else if (params?.year) {
      query.set('year', String(params.year));
    }
    if (params?.yearFrom) query.set('yearFrom', String(params.yearFrom));
    if (params?.yearTo) query.set('yearTo', String(params.yearTo));
    if (params?.subject) query.set('subject', params.subject);
    if (params?.subSubject) query.set('subSubject', params.subSubject);
    if (params?.topic) {
      if (Array.isArray(params.topic)) {
        params.topic.forEach((t) => {
          if (t) query.append('topic', t);
        });
      } else {
        query.set('topic', params.topic);
      }
    }
    if (params?.paper) query.set('paper', params.paper);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/pyq/questions${qs ? `?${qs}` : ''}`);
  },
  getCounts: (params?: {
    mode?: 'prelims' | 'mains';
    year?: number;
    years?: number[];
    yearFrom?: number;
    yearTo?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.years && params.years.length > 0) {
      params.years.forEach((y) => query.append('years', String(y)));
    } else if (params?.year) {
      query.set('year', String(params.year));
    }
    if (params?.yearFrom) query.set('yearFrom', String(params.yearFrom));
    if (params?.yearTo) query.set('yearTo', String(params.yearTo));
    const qs = query.toString();
    return api.get<any>(`/pyq/counts${qs ? `?${qs}` : ''}`);
  },
  submitPrelimsAnswer: (questionId: string, selectedOption: string) =>
    api.post<any>(`/pyq/prelims/${questionId}/submit`, { selectedOption }, authConfig()),

  // Mains AI evaluation
  submitMainsAnswer: async (
    questionId: string,
    opts: { answerText?: string; file?: File; files?: File[] }
  ): Promise<{ status: string; data?: { attemptId: string; status: string }; message?: string }> => {
    const fd = new FormData();
    if (opts.answerText) fd.append('answerText', opts.answerText);
    if (opts.file) fd.append('file', opts.file);
    if (opts.files) {
      opts.files.forEach((file) => fd.append('files', file));
    }

    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/pyq/mains/${questionId}/submit`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Submit failed');
    return json;
  },
  getMainsEvaluationStatus: (questionId: string, attemptId: string) =>
    api.get<any>(
      `/pyq/mains/${questionId}/evaluation-status?attemptId=${encodeURIComponent(attemptId)}`,
      authConfig()
    ),
  getMainsResults: (questionId: string, attemptId: string) =>
    api.get<any>(
      `/pyq/mains/${questionId}/results?attemptId=${encodeURIComponent(attemptId)}`,
      authConfig()
    ),
};

// ==================== Flashcards ====================

export const flashcardService = {
  getSubjects: () => api.get<any>('/flashcards/subjects', authConfig()),
  getTopics: (subjectId: string) => api.get<any>(`/flashcards/${subjectId}/topics`, authConfig()),
  getCards: (subjectId: string, topicId: string) =>
    api.get<any>(`/flashcards/${subjectId}/${topicId}`, authConfig()),
  createCard: async (data: {
    subjectId: string;
    subject?: string;
    topicId?: string;
    topic?: string;
    question: string;
    answer: string;
    difficulty?: string;
  }) => api.post<any>('/flashcards', data, await freshAuthConfig()),
  updateProgress: (cardId: string, mastered: boolean) =>
    api.patch<any>(`/flashcards/${cardId}/progress`, { mastered }, authConfig()),
};

// ==================== Spaced Repetition ====================

export const spacedRepService = {
  getItems: (sourceType?: string) => {
    const qs = sourceType ? `?sourceType=${sourceType}` : '';
    return api.get<any>(`/spaced-repetition${qs}`, authConfig());
  },
  addItem: (data: {
    questionText: string;
    subject: string;
    source?: string;
    sourceType?: string;
    scheduleDay?: number;
    scheduleDays?: number[];
    remindEnabled?: boolean;
  }) => api.post<any>('/spaced-repetition', data, authConfig()),
  updateItem: (
    id: string,
    data: { scheduleDay?: number; scheduleDays?: number[]; remindEnabled?: boolean; addedToFlashcard?: boolean }
  ) =>
    api.patch<any>(`/spaced-repetition/${id}`, data, authConfig()),
  deleteItem: (id: string) => api.delete<any>(`/spaced-repetition/${id}`, authConfig()),
};

// ==================== Mindmap ====================

export const mindmapService = {
  getSubjects: () => api.get<any>('/mindmaps/subjects', authConfig()),
  getMindmaps: (subjectId: string) => api.get<any>(`/mindmaps/${subjectId}`, authConfig()),
  getMindmap: (subjectId: string, mindmapId: string) =>
    api.get<any>(`/mindmaps/${subjectId}/${mindmapId}`, authConfig()),
  updateProgress: (mindmapId: string, mastery: number, viewed?: boolean) =>
    api.patch<any>(`/mindmaps/${mindmapId}/progress`, { mastery, viewed }, authConfig()),
};

// ==================== Study Groups ====================

export const studyGroupService = {
  getGroups: (params?: { subject?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<any[]>(`/study-groups${qs ? `?${qs}` : ''}`, authConfig());
  },
  getGroup: (id: string) => api.get<any>(`/study-groups/${id}`, authConfig()),
  createGroup: (data: { name: string; description?: string; subject: string; status?: string; maxMembers?: number }) =>
    api.post<any>('/study-groups', data, authConfig()),
  joinGroup: (id: string) => api.post<any>(`/study-groups/${id}/join`, {}, authConfig()),
  leaveGroup: (id: string) => api.post<any>(`/study-groups/${id}/leave`, {}, authConfig()),
  getMessages: (id: string, after?: string) => {
    const qs = after ? `?after=${encodeURIComponent(after)}` : '';
    return api.get<any[]>(`/study-groups/${id}/messages${qs}`, authConfig());
  },
  postMessage: (id: string, content: string) =>
    api.post<any>(`/study-groups/${id}/messages`, { content }, authConfig()),
  getMyGroups: () => api.get<any[]>('/study-groups/my-groups', authConfig()),
};

// ==================== User Profile & Settings ====================

export const userService = {
  getProfile: () => api.get<any>('/user/profile', authConfig()),
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; bio?: string; state?: string; targetYear?: string; optionalSubject?: string; gender?: string; dateOfBirth?: string }) =>
    api.put<any>('/user/profile', data, authConfig()),
  updateSettings: (data: { notifications?: any; preferences?: any; privacy?: any; profile?: any }) =>
    api.put<any>('/user/settings', data, authConfig()),
  submitFeedback: (data: { rating: number; category?: string; workingWell?: string; couldBeBetter?: string }) =>
    api.post<any>('/user/feedback', data, authConfig()),
  getSyllabusTracker: () => api.get<any>('/user/syllabus-tracker', authConfig()),
  saveSyllabusTracker: (data: { mode: string; states: any }) =>
    api.put<any>('/user/syllabus-tracker', data, authConfig()),
  getSessions: () => api.get<any>('/user/sessions', authConfig()),
  revokeSession: (sessionId: string) => api.delete<any>(`/user/sessions/${sessionId}`, authConfig()),
  getSubscription: () => api.get<any>('/user/subscription', authConfig()),
  startTrial: () => api.post<any>('/user/subscription/trial', {}, authConfig()),
  cancelSubscription: () => api.put<any>('/user/subscription/cancel', {}, authConfig()),
  getOrders: () => api.get<any>('/user/orders', authConfig()),
  getNotifications: () => api.get<any>('/user/notifications', authConfig()),
  createNotification: (data: { title: string; body: string; type?: string }) =>
    api.post<any>('/user/notifications', data, authConfig()),
  markNotificationRead: (id: string) => api.patch<any>(`/user/notifications/${id}/read`, {}, authConfig()),
  markAllNotificationsRead: () => api.patch<any>('/user/notifications/read-all', {}, authConfig()),
};

// ==================== Syllabus Data ====================

export const syllabusService = {
  getSyllabus: () => api.get<any>('/syllabus'),
};

// ==================== Leaderboard ====================

export const leaderboardService = {
  getLeaderboard: (tab: string = 'overall', range: string = 'all') =>
    api.get<any>(`/leaderboard?tab=${encodeURIComponent(tab)}&range=${encodeURIComponent(range)}`, authConfig()),
  getMyRank: (range: string = 'all') =>
    api.get<any>(`/leaderboard/me?range=${encodeURIComponent(range)}`, authConfig()),
};

// ==================== Contact ====================

export const contactService = {
  submit: (data: { firstName: string; lastName: string; email: string; subject: string; message: string }) =>
    api.post<any>('/contact', data),
};

// ==================== Admin ====================

export const adminService = {
  // Analytics
  getAnalytics: () => api.get<any>('/admin/analytics', authConfig()),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<any>(`/admin/users${qs ? `?${qs}` : ''}`, authConfig());
  },
  updateUser: (id: string, data: { role?: string; status?: string }) =>
    api.put<any>(`/admin/users/${id}`, data, authConfig()),

  // PYQ Management
  uploadPYQ: async (file: File, mode: 'prelims' | 'mains' = 'prelims') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/pyq/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    return res.json();
  },
  getPYQUploads: () => api.get<any>('/admin/pyq/uploads', authConfig()),
  getPYQUploadDetail: (id: string) => api.get<any>(`/admin/pyq/uploads/${id}`, authConfig()),
  getPYQQuestions: (params?: { mode?: 'prelims' | 'mains'; status?: string; subject?: string; year?: number; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.status) query.set('status', params.status);
    if (params?.subject) query.set('subject', params.subject);
    if (params?.year) query.set('year', String(params.year));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/admin/pyq/questions${qs ? `?${qs}` : ''}`, authConfig());
  },
  updatePYQQuestion: (id: string, data: any, mode: 'prelims' | 'mains' = 'prelims') =>
    api.put<any>(`/admin/pyq/questions/${id}?mode=${mode}`, data, authConfig()),
  bulkApprovePYQ: (ids: string[], status: string, mode: 'prelims' | 'mains' = 'prelims') =>
    api.post<any>(`/admin/pyq/questions/bulk-approve?mode=${mode}`, { ids, status }, authConfig()),
  getPYQStats: (mode: 'prelims' | 'mains' = 'prelims') => api.get<any>(`/admin/pyq/stats?mode=${mode}`, authConfig()),

  // Daily MCQ
  getDailyMCQSets: () => api.get<any>('/admin/daily-mcq', authConfig()),
  createDailyMCQ: (data: any) => api.post<any>('/admin/daily-mcq', data, authConfig()),
  generateDailyMCQ: () => api.post<any>('/admin/daily-mcq/generate', {}, authConfig()),

  // Daily Mains
  getDailyMainsQuestions: () => api.get<any>('/admin/daily-mains', authConfig()),
  createDailyMains: (data: any) => api.post<any>('/admin/daily-mains', data, authConfig()),
  updateDailyMains: (id: string, data: any) => api.put<any>(`/admin/daily-mains/${id}`, data, authConfig()),
  generateDailyMains: () => api.post<any>('/admin/daily-mains/generate', {}, authConfig()),

  // Editorials
  getEditorials: () => api.get<any>('/admin/editorials', authConfig()),
  createEditorial: (data: any) => api.post<any>('/admin/editorials', data, authConfig()),
  updateEditorial: (id: string, data: any) => api.put<any>(`/admin/editorials/${id}`, data, authConfig()),
  deleteEditorial: (id: string) => api.delete<any>(`/admin/editorials/${id}`, authConfig()),
  triggerScrape: () => api.post<any>('/admin/editorials/scrape', {}, authConfig()),
  triggerSummarize: (id: string) => api.post<any>(`/admin/editorials/${id}/summarize`, {}, authConfig()),

  // Video Management
  getVideoSubjects: () => api.get<any>('/admin/videos/subjects', authConfig()),
  createVideoSubject: (data: { name: string; description?: string; iconUrl?: string; order?: number }) =>
    api.post<any>('/admin/videos/subjects', data, authConfig()),
  updateVideoSubject: (id: string, data: any) => api.put<any>(`/admin/videos/subjects/${id}`, data, authConfig()),
  deleteVideoSubject: (id: string) => api.delete<any>(`/admin/videos/subjects/${id}`, authConfig()),
  createVideo: (data: { subjectId: string; title: string; description?: string; videoUrl?: string; thumbnailUrl?: string; duration?: number; instructor?: string; order?: number }) =>
    api.post<any>('/admin/videos', data, authConfig()),
  updateVideo: (id: string, data: any) => api.put<any>(`/admin/videos/${id}`, data, authConfig()),
  deleteVideo: (id: string) => api.delete<any>(`/admin/videos/${id}`, authConfig()),
  getVideoQuestions: (videoId: string) => api.get<any>(`/admin/videos/${videoId}/questions`, authConfig()),
  createVideoQuestion: (videoId: string, data: { question: string; options: string[]; correctOption: number; explanation?: string; order?: number }) =>
    api.post<any>(`/admin/videos/${videoId}/questions`, data, authConfig()),
  deleteVideoQuestion: (videoId: string, qid: string) => api.delete<any>(`/admin/videos/${videoId}/questions/${qid}`, authConfig()),

  // Testimonials Management
  getTestimonials: () => api.get<any>('/admin/testimonials', authConfig()),
  createTestimonial: (data: { name: string; title: string; content: string; avatarUrl?: string; rating?: number; order?: number }) =>
    api.post<any>('/admin/testimonials', data, authConfig()),
  updateTestimonial: (id: string, data: any) => api.put<any>(`/admin/testimonials/${id}`, data, authConfig()),
  deleteTestimonial: (id: string) => api.delete<any>(`/admin/testimonials/${id}`, authConfig()),

  // Pricing Plans Management
  getPricingPlans: () => api.get<any>('/admin/pricing', authConfig()),
  createPricingPlan: (data: { name: string; price: number; duration: string; features?: string[]; isPopular?: boolean; order?: number }) =>
    api.post<any>('/admin/pricing', data, authConfig()),
  updatePricingPlan: (id: string, data: any) => api.put<any>(`/admin/pricing/${id}`, data, authConfig()),
  deletePricingPlan: (id: string) => api.delete<any>(`/admin/pricing/${id}`, authConfig()),

  // Billing Management
  getAdminSubscriptions: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/billing/admin/subscriptions${qs ? `?${qs}` : ''}`, authConfig());
  },
  getAdminOrders: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/billing/admin/orders${qs ? `?${qs}` : ''}`, authConfig());
  },
  getAdminPayments: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/billing/admin/payments${qs ? `?${qs}` : ''}`, authConfig());
  },
  extendSubscription: (id: string, days: number) =>
    api.post<any>(`/billing/admin/subscriptions/${id}/extend`, { days }, authConfig()),

  // FAQ Management
  getFaqs: () => api.get<any>('/admin/faqs', authConfig()),
  createFaq: (data: { category: string; question: string; answer: string; order?: number; isActive?: boolean }) =>
    api.post<any>('/admin/faqs', data, authConfig()),
  updateFaq: (id: string, data: any) => api.put<any>(`/admin/faqs/${id}`, data, authConfig()),
  deleteFaq: (id: string) => api.delete<any>(`/admin/faqs/${id}`, authConfig()),

  // CMS
  getCmsPages: () => api.get<any>('/admin/cms/pages', authConfig()),
  getCmsPage: (slug: string) => api.get<any>(`/admin/cms/pages/${encodeURIComponent(slug)}`, authConfig()),
  bulkUpdateCmsSections: (slug: string, sections: any[]) =>
    api.put<any>(`/admin/cms/pages/${encodeURIComponent(slug)}/bulk`, { sections }, authConfig()),
  createCmsSection: (data: any) => api.post<any>('/admin/cms/sections', data, authConfig()),
  updateCmsSection: (id: string, data: any) => api.put<any>(`/admin/cms/sections/${id}`, data, authConfig()),
  deleteCmsSection: (id: string) => api.delete<any>(`/admin/cms/sections/${id}`, authConfig()),
  uploadCmsMedia: async (file: File): Promise<{ url: string; path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/cms/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json.data;
  },

  // Flashcard Management
  getFlashcardDecks: () => api.get<any>('/admin/flashcards/decks', authConfig()),
  createFlashcardDeck: (data: { subject: string; subjectId: string; icon?: string }) =>
    api.post<any>('/admin/flashcards/decks', data, authConfig()),
  updateFlashcardDeck: (id: string, data: { subject?: string; subjectId?: string; icon?: string }) =>
    api.put<any>(`/admin/flashcards/decks/${id}`, data, authConfig()),
  deleteFlashcardDeck: (id: string) => api.delete<any>(`/admin/flashcards/decks/${id}`, authConfig()),
  getFlashcardCards: (deckId?: string) =>
    api.get<any>(`/admin/flashcards/cards${deckId ? `?deckId=${deckId}` : ''}`, authConfig()),
  createFlashcardCard: (data: { deckId: string; topic: string; topicId: string; question: string; answer: string; difficulty?: string }) =>
    api.post<any>('/admin/flashcards/cards', data, authConfig()),
  updateFlashcardCard: (id: string, data: any) =>
    api.put<any>(`/admin/flashcards/cards/${id}`, data, authConfig()),
  deleteFlashcardCard: (id: string) => api.delete<any>(`/admin/flashcards/cards/${id}`, authConfig()),

  // Mindmap Management
  getMindmapSubjects: () => api.get<any>('/admin/mindmaps/subjects', authConfig()),
  createMindmapSubject: (data: { name: string; slug: string; icon?: string }) =>
    api.post<any>('/admin/mindmaps/subjects', data, authConfig()),
  updateMindmapSubject: (id: string, data: { name?: string; slug?: string; icon?: string }) =>
    api.put<any>(`/admin/mindmaps/subjects/${id}`, data, authConfig()),
  deleteMindmapSubject: (id: string) => api.delete<any>(`/admin/mindmaps/subjects/${id}`, authConfig()),
  getAdminMindmaps: () => api.get<any>('/admin/mindmaps', authConfig()),
  createAdminMindmap: (data: { subjectSlug: string; subjectName?: string; subjectIcon?: string; title: string; slug: string; branches: any; nodes: any; quizData?: any }) =>
    api.post<any>('/admin/mindmaps', data, authConfig()),
  updateAdminMindmap: (id: string, data: { title?: string; slug?: string; branches?: any; nodes?: any; quizData?: any }) =>
    api.put<any>(`/admin/mindmaps/${id}`, data, authConfig()),
  deleteAdminMindmap: (id: string) => api.delete<any>(`/admin/mindmaps/${id}`, authConfig()),

  // Spaced Rep Seeds
  getSpacedRepSeeds: (subject?: string) =>
    api.get<any>(`/admin/spaced-rep/seeds${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`, authConfig()),
  createSpacedRepSeed: (data: { subject: string; topic?: string; questionText: string; difficulty?: string }) =>
    api.post<any>('/admin/spaced-rep/seeds', data, authConfig()),
  updateSpacedRepSeed: (id: string, data: any) =>
    api.put<any>(`/admin/spaced-rep/seeds/${id}`, data, authConfig()),
  deleteSpacedRepSeed: (id: string) => api.delete<any>(`/admin/spaced-rep/seeds/${id}`, authConfig()),

  // Library
  getLibraryTree: (stage = 'prelims') => api.get<any>(`/admin/library/tree?stage=${encodeURIComponent(stage)}`, authConfig()),
  getLibrarySubjects: () => api.get<any>('/admin/library/subjects', authConfig()),
  createLibrarySubject: (data: any) => api.post<any>('/admin/library/subjects', data, authConfig()),
  updateLibrarySubject: (id: string, data: any) => api.put<any>(`/admin/library/subjects/${id}`, data, authConfig()),
  deleteLibrarySubject: (id: string) => api.delete<any>(`/admin/library/subjects/${id}`, authConfig()),
  getLibraryChapters: (subjectId?: string) =>
    api.get<any>(`/admin/library/chapters${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`, authConfig()),
  createLibraryChapter: (data: any) => api.post<any>('/admin/library/chapters', data, authConfig()),
  updateLibraryChapter: (id: string, data: any) => api.put<any>(`/admin/library/chapters/${id}`, data, authConfig()),
  deleteLibraryChapter: (id: string) => api.delete<any>(`/admin/library/chapters/${id}`, authConfig()),
  getLibraryMaterials: (chapterId?: string) =>
    api.get<any>(`/admin/library/materials${chapterId ? `?chapterId=${encodeURIComponent(chapterId)}` : ''}`, authConfig()),
  uploadLibraryMaterial: async (
    file: File,
    topicId: string,
    title: string,
    type?: string,
    options?: { description?: string; accessLevel?: string; isPublished?: boolean; order?: number }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', topicId);
    formData.append('title', title);
    if (type) formData.append('type', type);
    if (options?.description) formData.append('description', options.description);
    if (options?.accessLevel) formData.append('accessLevel', options.accessLevel);
    if (options?.isPublished !== undefined) formData.append('isPublished', String(options.isPublished));
    if (options?.order !== undefined) formData.append('order', String(options.order));

    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/library/materials/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    return res.json();
  },
  deleteLibraryMaterial: (id: string) => api.delete<any>(`/admin/library/materials/${id}`, authConfig()),

  // Syllabus
  getSyllabusSubjects: () => api.get<any>('/admin/syllabus/subjects', authConfig()),
  createSyllabusSubject: (data: any) => api.post<any>('/admin/syllabus/subjects', data, authConfig()),
  updateSyllabusSubject: (id: string, data: any) => api.put<any>(`/admin/syllabus/subjects/${id}`, data, authConfig()),
  deleteSyllabusSubject: (id: string) => api.delete<any>(`/admin/syllabus/subjects/${id}`, authConfig()),
  createSyllabusTopic: (data: any) => api.post<any>('/admin/syllabus/topics', data, authConfig()),
  updateSyllabusTopic: (id: string, data: any) => api.put<any>(`/admin/syllabus/topics/${id}`, data, authConfig()),
  deleteSyllabusTopic: (id: string) => api.delete<any>(`/admin/syllabus/topics/${id}`, authConfig()),
  createSyllabusSubTopic: (data: any) => api.post<any>('/admin/syllabus/sub-topics', data, authConfig()),
  updateSyllabusSubTopic: (id: string, data: any) => api.put<any>(`/admin/syllabus/sub-topics/${id}`, data, authConfig()),
  deleteSyllabusSubTopic: (id: string) => api.delete<any>(`/admin/syllabus/sub-topics/${id}`, authConfig()),
};

// ==================== Test Series (Next.js /api/test-series + Supabase) ====================

async function testSeriesRequest<T>(
  path: string,
  init?: RequestInit
): Promise<{ status: 'success' | 'error'; data?: T; message?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (init?.body && typeof init.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/test-series${path}`, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    data?: T;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return { status: (json.status as 'success') || 'success', data: json.data, message: json.message };
}

export const testSeriesService = {
  getStats: () => testSeriesRequest<any>('/stats'),
  listSeries: () => testSeriesRequest<any[]>(''),
  getSeriesDetail: (seriesId: string) => testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}`),
  getEnrolled: () => testSeriesRequest<any[]>('/enrolled'),
  enroll: (seriesId: string) =>
    testSeriesRequest<{ seriesId: string }>(`/${encodeURIComponent(seriesId)}/enroll`, { method: 'POST', body: '{}' }),
  unenroll: (seriesId: string) =>
    testSeriesRequest<{ seriesId: string }>(`/${encodeURIComponent(seriesId)}/enroll`, { method: 'DELETE' }),
  getAnalytics: (seriesId: string) => testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}/analytics`),
  getQuestions: (seriesId: string, testId: string) =>
    testSeriesRequest<any>(
      `/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}/questions`
    ),
  submitTest: (seriesId: string, testId: string, answers: Record<string, number>, timeTaken: number) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeTaken }),
    }),
  // Admin – series
  createSeries: (data: Record<string, unknown>) =>
    testSeriesRequest<any>('', { method: 'POST', body: JSON.stringify(data) }),
  updateSeries: (seriesId: string, data: Record<string, unknown>) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSeries: (seriesId: string) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}`, { method: 'DELETE' }),
  // Admin – tests
  listAdminTests: (seriesId: string) =>
    testSeriesRequest<any[]>(`/${encodeURIComponent(seriesId)}/tests`),
  createTest: (seriesId: string, data: { title: string; sortOrder?: number }) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}/tests`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAdminTest: (seriesId: string, testId: string) =>
    testSeriesRequest<any>(
      `/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}`
    ),
  updateTest: (seriesId: string, testId: string, data: Record<string, unknown>) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTest: (seriesId: string, testId: string) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}`, {
      method: 'DELETE',
    }),
  putQuestions: (seriesId: string, testId: string, questions: unknown[]) =>
    testSeriesRequest<any>(`/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}/questions`, {
      method: 'PUT',
      body: JSON.stringify({ questions }),
    }),
  extractPdfText: (seriesId: string, testId: string) =>
    testSeriesRequest<any>(
      `/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}/extract-pdf`,
      { method: 'POST', body: '{}' }
    ),
  parsePdfQuestions: (seriesId: string, testId: string, autoSave = false) =>
    testSeriesRequest<{ questions: any[]; totalParsed: number; saved: boolean }>(
      `/${encodeURIComponent(seriesId)}/tests/${encodeURIComponent(testId)}/parse-pdf`,
      { method: 'POST', body: JSON.stringify({ autoSave }) }
    ),
  uploadAsset: async (formData: FormData) => {
    const token = getToken();
    const res = await fetch('/api/test-series/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json as { status: string; data: { url: string; path: string } };
  },
};

// ==================== Study Materials (RAG) ====================

export const studyMaterialService = {
  list: (params?: { subject?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<any>(`/admin/study-materials${qs ? `?${qs}` : ''}`, authConfig());
  },
  upload: async (file: File, subject: string, topic?: string, source?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    if (topic) formData.append('topic', topic);
    if (source) formData.append('source', source);
    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/study-materials/upload`,
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },
  delete: (id: string) => api.delete<any>(`/admin/study-materials/${id}`, authConfig()),

  listMockMaterials: (params?: { subject?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<any>(`/admin/mock-test-materials${qs ? `?${qs}` : ''}`, authConfig());
  },
  uploadMockMaterial: async (file: File, subject: string, topic?: string, source?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    if (topic) formData.append('topic', topic);
    if (source) formData.append('source', source);
    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/admin/mock-test-materials/upload`,
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },
  deleteMockMaterial: (id: string) => api.delete<any>(`/admin/mock-test-materials/${id}`, authConfig()),
};

// ==================== Video Lectures ====================

export const videoService = {
  getSubjects: () => api.get<any>('/videos/subjects', authConfig()),
  getVideos: () => api.get<any>('/videos', authConfig()),
  getStats: () => api.get<any>('/videos/stats', authConfig()),
  getVideosBySubject: (subject: string) => api.get<any>(`/videos/${encodeURIComponent(subject)}`, authConfig()),
  getQuestions: (videoId: string) => api.get<any>(`/videos/${videoId}/questions`, authConfig()),
  submitQuiz: (videoId: string, answers: Record<string, number>) =>
    api.post<any>(`/videos/${videoId}/submit`, { answers }, authConfig()),
  askMentor: (data: { question: string; name?: string }) => api.post<any>('/videos/mentor/ask', data, authConfig()),
};

// ==================== Forum ====================

export const forumService = {
  getPosts: (params?: { subject?: string; search?: string; sort?: 'latest' | 'top' | 'unanswered'; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.subject && params.subject !== 'all') query.set('subject', params.subject);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/forum/posts${qs ? `?${qs}` : ''}`, authConfig());
  },
  getPost: (id: string) => api.get<any>(`/forum/posts/${encodeURIComponent(id)}`, authConfig()),
  createPost: (data: { title: string; body: string; subject: string; tags?: string[] }) =>
    api.post<any>('/forum/posts', data, authConfig()),
  createAnswer: (postId: string, body: string) =>
    api.post<any>(`/forum/posts/${encodeURIComponent(postId)}/answers`, { body }, authConfig()),
  vote: (data: { postId?: string; answerId?: string; direction: 1 | -1 }) =>
    api.post<any>('/forum/vote', data, authConfig()),
  createBookmark: (postId: string) => api.post<any>('/forum/bookmarks', { postId }, authConfig()),
  deleteBookmark: (postId: string) => api.delete<any>(`/forum/bookmarks/${encodeURIComponent(postId)}`, authConfig()),
  getMyPosts: () => api.get<any>('/forum/my-posts', authConfig()),
  getMyAnswers: () => api.get<any>('/forum/my-answers', authConfig()),
  getBookmarks: () => api.get<any>('/forum/bookmarks', authConfig()),
  getSubjects: () => api.get<any>('/forum/subjects', authConfig()),
};
