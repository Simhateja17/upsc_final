'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { userService, syllabusService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { useCmsContent } from '@/hooks/useCmsContent';
import { SYLLABUS_DATA } from '@/data/syllabus/syllabusData';
import HeroSection from './components/HeroSection';
import StageTabs from './components/StageTabs';
import SubjectList from './components/SubjectList';
import TopicList from './components/TopicList';
import SubTopicsList from './components/SubTopicsList';
import RightPanel from './components/RightPanel';
import StatusModal from './components/StatusModal';

export type Mode = 'prelims' | 'mains' | 'optional';
export type Status = 'none' | 'done' | 'in-progress' | 'needs-revision' | 'weak';

export interface Subject {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  bg: string;
  topics: { name: string; subs: string[] }[];
}

export interface SyllabusData {
  prelims: Subject[];
  mains: Subject[];
  optional: Subject[];
}

export interface SubTopicState {
  status: Status;
  note?: string;
  important?: boolean;
}

export interface TrackerState {
  [key: string]: SubTopicState; // key format: `${subjectId}__${topicIndex}__${subTopicIndex}`
}

export default function SyllabusTrackerPage() {
  const { user } = useAuth();
  const { content: cms, loading: cmsLoading } = useCmsContent('dashboard/syllabus-tracker', {
    hero_badge: 'PERSONALIZED SYLLABUS TRACKER',
    hero_title_prefix: 'Know Exactly Where You Stand,',
    hero_title_suffix: '.',
    hero_subtitle: "Your UPSC syllabus, fully mapped. Track every topic across Prelims, Mains and Optional — see what's done, what's pending, and what to conquer next.",
    stat_labels: JSON.stringify({ overall: 'Overall', done: 'Done', revising: 'Revising', remaining: 'Remaining' }),
    stage_tabs: JSON.stringify({ prelims: 'Prelims', mains: 'Mains', optional: 'Optional' }),
    filter_labels: JSON.stringify({ all: 'All', pending: 'Pending', done: 'Done', important: 'Important' }),
    status_labels: JSON.stringify({ none: 'Not Started', done: 'Done', in_progress: 'Reading', needs_revision: 'Needs Revision', weak: 'Weak Area' }),
    right_panel_title: 'Subject Progress',
    right_panel_view_all: 'View all →',
    cta_title: "Plan Today's Study",
    cta_subtitle: 'Set daily goals with Jeet AI and stay on track for UPSC 2026.',
    cta_button: '+ Add in Study Planner',
    modal_title: 'Syllabus Progress Overview',
    subtopic_placeholder_title: 'Sub-Topics',
    subtopic_placeholder_subtitle: 'Select a topic to start tracking',
    subtopic_placeholder_body: 'Select a subject, then tap a topic to begin tracking progress.',
    stats_strip_labels: JSON.stringify({ total: 'Total', done: 'Done', active: 'Active', left: 'Left' }),
    pyq_button: '📜 PYQs',
  });

  const [mode, setMode] = useState<Mode>('prelims');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<{ subjectId: string; topicIndex: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'important'>('all');
  const [states, setStates] = useState<TrackerState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null);
  const [syllabusLoading, setSyllabusLoading] = useState(true);
  const [modalData, setModalData] = useState<{
    key: string;
    name: string;
    subjectId: string;
    topicIndex: number;
    subTopicIndex: number;
  } | null>(null);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const normalizeSyllabusData = useCallback((raw: SyllabusData): SyllabusData => {
    const mains = [...(raw.mains || [])];
    const essayIndex = mains.findIndex((subject) =>
      subject.short.toLowerCase().includes('essay') || subject.name.toLowerCase().includes('essay')
    );

    if (essayIndex > -1 && essayIndex !== mains.length - 1) {
      const [essay] = mains.splice(essayIndex, 1);
      mains.push(essay);
    }

    return {
      prelims: raw.prelims || [],
      mains,
      optional: raw.optional || [],
    };
  }, []);

  // Load syllabus structure from API
  useEffect(() => {
    let mounted = true;
    const cacheKey = 'rwj_syllabus_cache_v1';

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as SyllabusData;
          setSyllabusData(normalizeSyllabusData(parsed));
          setSyllabusLoading(false);
        } catch {}
      }
    }

    syllabusService.getSyllabus()
      .then(res => {
        if (!mounted || !res.data) return;
        const normalized = normalizeSyllabusData(res.data);
        setSyllabusData(normalized);
        setSyllabusLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(normalized));
        }
      })
      .catch(err => {
        if (!mounted) return;
        console.error('Failed to load syllabus data:', err);
        setSyllabusData(prev => prev ?? normalizeSyllabusData(SYLLABUS_DATA));
        setSyllabusLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [normalizeSyllabusData]);

  // Load tracker state from API on mount, fall back to localStorage
  useEffect(() => {
    userService.getSyllabusTracker()
      .then(res => {
        if (res.data && Object.keys(res.data.states).length > 0) {
          setStates(res.data.states);
          setMode(res.data.mode || 'prelims');
          localStorage.setItem('syllabusTrackerState', JSON.stringify(res.data.states));
        } else {
          const saved = localStorage.getItem('syllabusTrackerState');
          if (saved) try { setStates(JSON.parse(saved)); } catch {}
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('syllabusTrackerState');
        if (saved) try { setStates(JSON.parse(saved)); } catch {}
      });
  }, []);

  // Debounced save to API + localStorage whenever state changes
  const debouncedSave = useCallback((newStates: TrackerState, currentMode: string) => {
    localStorage.setItem('syllabusTrackerState', JSON.stringify(newStates));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      userService.saveSyllabusTracker({ mode: currentMode, states: newStates }).catch(() => {});
    }, 1500);
  }, []);

  useEffect(() => {
    if (Object.keys(states).length > 0) {
      debouncedSave(states, mode);
    }
  }, [states, mode, debouncedSave]);

  const getKey = (subjectId: string, topicIndex: number, subTopicIndex: number) => 
    `${subjectId}__${topicIndex}__${subTopicIndex}`;

  const updateSubTopicState = (key: string, update: Partial<SubTopicState>) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: prev[key]?.status || 'none',
        ...update,
      },
    }));
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setActiveSubject(null);
    setOpenTopics(new Set());
    setSelectedTopic(null);
    setFilter('all');
    setSearchQuery('');
  };

  const handleSubjectSelect = (subjectId: string) => {
    setActiveSubject(subjectId);
    setOpenTopics(new Set());
    setSelectedTopic(null);
  };

  const handleTopicToggle = (subjectId: string, topicIndex: number) => {
    const topicKey = `${subjectId}__${topicIndex}`;
    const newOpenTopics = new Set(openTopics);
    
    if (newOpenTopics.has(topicKey)) {
      newOpenTopics.delete(topicKey);
    } else {
      newOpenTopics.add(topicKey);
    }
    
    setOpenTopics(newOpenTopics);
    setSelectedTopic({ subjectId, topicIndex });
  };

  const handleExpandAll = () => {
    if (!activeSubject || !syllabusData) return;
    const subject = syllabusData[mode].find(s => s.id === activeSubject);
    if (!subject) return;

    const newOpenTopics = new Set<string>();
    subject.topics.forEach((_, index) => {
      newOpenTopics.add(`${activeSubject}__${index}`);
    });
    setOpenTopics(newOpenTopics);
  };

  const handleCollapseAll = () => {
    setOpenTopics(new Set());
  };

  const handleQuickDone = (subjectId: string, topicIndex: number, subTopicIndex: number) => {
    const key = getKey(subjectId, topicIndex, subTopicIndex);
    const currentStatus = states[key]?.status || 'none';
    updateSubTopicState(key, { status: currentStatus === 'done' ? 'none' : 'done' });
  };

  const openStatusModal = (subjectId: string, topicIndex: number, subTopicIndex: number, name: string) => {
    const key = getKey(subjectId, topicIndex, subTopicIndex);
    setModalData({ key, name, subjectId, topicIndex, subTopicIndex });
  };

  const closeStatusModal = () => {
    setModalData(null);
  };

  const saveStatusFromModal = (status: Status, note: string) => {
    if (!modalData) return;
    updateSubTopicState(modalData.key, { status, note: note.trim() || undefined });
    closeStatusModal();
  };

  const toggleImportant = (subjectId: string, topicIndex: number, subTopicIndex: number) => {
    const key = getKey(subjectId, topicIndex, subTopicIndex);
    const current = states[key]?.important || false;
    updateSubTopicState(key, { important: !current });
  };

  if (syllabusLoading || !syllabusData) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f3f6fb]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#e8a820] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#3c4f6d] text-sm">Loading syllabus...</p>
        </div>
      </div>
    );
  }

  const currentSubjects = syllabusData[mode];
  const currentSubject = activeSubject
    ? currentSubjects.find(s => s.id === activeSubject)
    : null;

  return (
    <div className="flex flex-col h-full bg-[#f3f6fb]">
      {/* Page Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="px-4 sm:px-6 lg:px-8 pt-[clamp(12px,1.6vw,20px)]">
          <HeroSection states={states} syllabusData={syllabusData} userName={user?.firstName} cms={cms} />
        </div>

        {/* Stage Tabs */}
        <div className="px-[18px] pt-[14px] pb-0">
          <StageTabs
            mode={mode}
            onModeChange={handleModeChange}
            states={states}
            syllabusData={syllabusData}
            cms={cms}
          />
        </div>

        {/* Tracker Area — four side-by-side columns */}
        <div className="flex items-stretch gap-[13px] p-[18px] pt-[12px]">
          {/* Column A - Subjects */}
          <div className="w-[210px] shrink-0 flex flex-col">
            <SubjectList
              subjects={currentSubjects}
              activeSubject={activeSubject}
              onSelectSubject={handleSubjectSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              states={states}
              mode={mode}
            />
          </div>

          {/* Column B - Topics */}
          <div className="w-[210px] shrink-0 flex flex-col">
            <TopicList
              subject={currentSubject}
              openTopics={openTopics}
              selectedTopic={selectedTopic}
              onToggleTopic={handleTopicToggle}
              states={states}
            />
          </div>

          {/* Column C - Sub-topics */}
          <div className="flex-1 min-w-0 flex flex-col">
            <SubTopicsList
              subject={currentSubject}
              selectedTopic={selectedTopic}
              filter={filter}
              onFilterChange={setFilter}
              states={states}
              onQuickDone={handleQuickDone}
              onOpenStatusModal={openStatusModal}
              onToggleImportant={toggleImportant}
              getKey={getKey}
              cms={cms}
            />
          </div>

          {/* Right Panel */}
          <RightPanel
            mode={mode}
            subjects={currentSubjects}
            states={states}
            syllabusData={syllabusData}
            cms={cms}
          />
        </div>
      </div>

      {/* Status Modal */}
      {modalData && (
        <StatusModal
          isOpen={!!modalData}
          subTopicName={modalData.name}
          currentStatus={states[modalData.key]?.status || 'none'}
          currentNote={states[modalData.key]?.note || ''}
          onClose={closeStatusModal}
          onSave={saveStatusFromModal}
        />
      )}
    </div>
  );
}
