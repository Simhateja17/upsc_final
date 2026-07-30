'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminService, studyMaterialService } from '@/lib/services';

interface StudyMaterialRow {
  id: string;
  file_name: string;
  subject: string;
  topic?: string | null;
  status?: string;
}

// Common starting points offered as one-click chips. The admin is NOT limited to
// these - any custom tag can be typed in the input below.
const SUGGESTED_TAGS = ['Popular', 'New', 'PDF Included'];

/**
 * Free-form tag editor: type a tag and press Enter (or comma) to add it, click a
 * suggestion chip, or hit Backspace on an empty field to remove the last tag.
 * De-duplicates case-insensitively so "New" and "new" don't both appear.
 */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const addTags = (raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    for (const p of parts) {
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft('');
  };

  const removeTag = (idx: number) => onChange(tags.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm flex flex-wrap gap-1.5 items-center min-h-[38px]">
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#EEF2FF', color: '#4338CA' }}>
            {tag}
            <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`}
              className="leading-none text-[#818CF8] hover:text-[#4338CA]" style={{ fontSize: '14px' }}>×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTags(draft); }
            else if (e.key === 'Backspace' && !draft && tags.length) { removeTag(tags.length - 1); }
          }}
          onBlur={() => addTags(draft)}
          placeholder={tags.length ? 'Add another…' : 'e.g. Popular, New, PDF Included'}
          className="flex-1 min-w-[140px] outline-none text-sm bg-transparent"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {SUGGESTED_TAGS.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())).map((s) => (
          <button key={s} type="button" onClick={() => addTags(s)}
            className="px-2 py-0.5 rounded-full text-xs border border-dashed border-[#C7D2FE] text-[#4F46E5] hover:bg-[#EEF2FF]">
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VideoManager() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [videoTags, setVideoTags] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  // Existing Study Material records, offered as the pool to link from. These
  // are the SAME rows managed on the Study Materials admin page - the single
  // source of truth for PDFs. We never upload a PDF onto a video here.
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterialRow[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialFilter, setMaterialFilter] = useState('');
  const [linkingMaterialId, setLinkingMaterialId] = useState<string | null>(null);

  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', iconUrl: '', order: 0 });
  const [videoForm, setVideoForm] = useState<{ subjectId: string; title: string; description: string; videoUrl: string; thumbnailUrl: string; duration: string; instructor: string; order: number; tags: string[] }>({ subjectId: '', title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: '', instructor: '', order: 0, tags: [] });
  const [questionForm, setQuestionForm] = useState({
    question: '',
    option0: '', option1: '', option2: '', option3: '',
    correctOption: 0,
    explanation: '',
    order: 0,
  });

  const loadSubjects = () => {
    setLoading(true);
    adminService.getVideoSubjects()
      .then((res) => setSubjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadStudyMaterials = () => {
    setMaterialsLoading(true);
    studyMaterialService.list()
      .then((res) => setStudyMaterials(Array.isArray(res.data) ? res.data : []))
      .catch(() => setStudyMaterials([]))
      .finally(() => setMaterialsLoading(false));
  };

  useEffect(() => { loadSubjects(); loadStudyMaterials(); }, []);

  // Resolve the display name of the currently-linked material: prefer the name
  // the backend returns on the video, else look it up in the loaded list.
  const linkedMaterial = useMemo(() => {
    const id = selectedVideo?.studyMaterialId;
    if (!id) return null;
    const found = studyMaterials.find((m) => m.id === id);
    return { id, file_name: selectedVideo?.studyMaterialName || found?.file_name || 'Linked material', subject: found?.subject };
  }, [selectedVideo, studyMaterials]);

  const filteredMaterials = useMemo(() => {
    const q = materialFilter.trim().toLowerCase();
    if (!q) return studyMaterials;
    return studyMaterials.filter((m) =>
      [m.file_name, m.subject, m.topic].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [studyMaterials, materialFilter]);

  const displaySubjectName = (name: string) =>
    name
      .replace(/^Indian Economy$/i, 'Economy')
      .replace(/^Modern History$/i, 'History')
      .replace(/^Indian Polity(?:\s*&\s*Governance)?$/i, 'Polity')
      .replace(/^Ethics,\s*Integrity\s*&\s*Aptitude$/i, 'Ethics');

  const resetSubjectForm = () => {
    setSubjectForm({ name: '', description: '', iconUrl: '', order: 0 });
    setEditingSubjectId(null);
    setShowSubjectForm(false);
  };

  const handleSaveSubject = async () => {
    setMsg('');
    try {
      if (editingSubjectId) {
        const payload = { ...subjectForm, name: displaySubjectName(subjectForm.name) };
        const res = await adminService.updateVideoSubject(editingSubjectId, payload);
        setMsg('Subject updated!');
        if (selectedSubject?.id === editingSubjectId) setSelectedSubject(res.data ?? { ...selectedSubject, ...payload });
      } else {
        await adminService.createVideoSubject({ ...subjectForm });
        setMsg('Subject created!');
      }
      resetSubjectForm();
      loadSubjects();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubjectId(subject.id);
    setSubjectForm({
      name: displaySubjectName(subject.name || ''),
      description: subject.description || '',
      iconUrl: subject.iconUrl || '',
      order: Number(subject.order || 0),
    });
    setShowSubjectForm(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all its videos?')) return;
    try {
      await adminService.deleteVideoSubject(id);
      if (selectedSubject?.id === id) { setSelectedSubject(null); setVideos([]); setSelectedVideo(null); setQuestions([]); }
      loadSubjects();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleCreateVideo = async () => {
    setMsg('');
    try {
      const data = { ...videoForm, duration: videoForm.duration ? parseInt(videoForm.duration) : undefined };
      await adminService.createVideo(data);
      setMsg('Video added!');
      setShowVideoForm(false);
      setVideoForm({ subjectId: selectedSubject?.id || '', title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: '', instructor: '', order: 0, tags: [] });
      if (selectedSubject) loadSubjectVideos(selectedSubject.id);
      loadSubjects();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await adminService.deleteVideo(id);
      setVideos(v => v.filter(x => x.id !== id));
      if (selectedVideo?.id === id) { setSelectedVideo(null); setQuestions([]); }
      loadSubjects();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const loadSubjectVideos = async (subjectId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/videos/${encodeURIComponent(subjectId)}`);
      const data = await res.json();
      const arr = Array.isArray(data.data) ? data.data : data.data?.videos;
      setVideos(Array.isArray(arr) ? arr : []);
    } catch {
      setVideos([]);
    }
  };

  const handleSelectSubject = (subject: any) => {
    setSelectedSubject(subject);
    setVideoForm(f => ({ ...f, subjectId: subject.id }));
    setSelectedVideo(null);
    setQuestions([]);
    loadSubjectVideos(subject.id);
  };

  const handleSelectVideo = (video: any) => {
    setMaterialFilter('');
    if (selectedVideo?.id === video.id) {
      setSelectedVideo(null);
      setQuestions([]);
      return;
    }
    setSelectedVideo(video);
    setVideoTags(Array.isArray(video.tags) ? video.tags : []);
    setShowQuestionForm(false);
    adminService.getVideoQuestions(video.id)
      .then(res => setQuestions(res.data || []))
      .catch(() => setQuestions([]));
  };

  const handleSaveVideoTags = async () => {
    if (!selectedVideo) return;
    setSavingTags(true);
    setMsg('');
    try {
      const res = await adminService.updateVideo(selectedVideo.id, { tags: videoTags });
      applyVideoUpdate(res?.data ?? { id: selectedVideo.id, tags: videoTags });
      setMsg('Tags updated!');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSavingTags(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedVideo) return;
    setMsg('');
    try {
      const options = [questionForm.option0, questionForm.option1, questionForm.option2, questionForm.option3];
      if (!questionForm.question.trim() || options.some(o => !o.trim())) {
        setMsg('Error: Please fill in the question and all 4 options.');
        return;
      }
      await adminService.createVideoQuestion(selectedVideo.id, {
        question: questionForm.question,
        options,
        correctOption: questionForm.correctOption,
        explanation: questionForm.explanation,
        order: questionForm.order,
      });
      setMsg('Question added!');
      setShowQuestionForm(false);
      setQuestionForm({ question: '', option0: '', option1: '', option2: '', option3: '', correctOption: 0, explanation: '', order: 0 });
      const res = await adminService.getVideoQuestions(selectedVideo.id);
      setQuestions(res.data || []);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteQuestion = async (qid: string) => {
    if (!confirm('Delete this question?') || !selectedVideo) return;
    try {
      await adminService.deleteVideoQuestion(selectedVideo.id, qid);
      setQuestions(q => q.filter(x => x.id !== qid));
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  // Reflect an updated video (e.g. after PDF upload/removal) in both the
  // selected-video panel and the list column.
  const applyVideoUpdate = (updated: any) => {
    if (!updated?.id) return;
    setSelectedVideo((prev: any) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
    setVideos((vs) => vs.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
  };

  // Link an existing Study Material record to the selected video (or unlink
  // with materialId = null). No PDF is uploaded or copied - we only store the
  // reference, keeping the Study Material module the single source of truth.
  const handleLinkMaterial = async (material: StudyMaterialRow | null) => {
    if (!selectedVideo) return;
    setMsg('');
    setLinkingMaterialId(material?.id ?? '__unlink__');
    try {
      const res = await adminService.linkVideoStudyMaterial(selectedVideo.id, material?.id ?? null);
      applyVideoUpdate(
        res?.data ?? {
          id: selectedVideo.id,
          studyMaterialId: material?.id ?? null,
          studyMaterialName: material?.file_name ?? null,
        },
      );
      setMsg(material ? `Linked "${material.file_name}" to this video.` : 'Study material unlinked.');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLinkingMaterialId(null);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div>
      <div className="flex items-center justify-between mb-[clamp(1.5rem,2vw,2rem)]">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          Video Lecture Manager
        </h1>
        <button
          onClick={() => {
            if (showSubjectForm) resetSubjectForm();
            else {
              setEditingSubjectId(null);
              setSubjectForm({ name: '', description: '', iconUrl: '', order: 0 });
              setShowSubjectForm(true);
            }
          }}
          className="px-4 py-2 rounded-lg text-sm font-inter font-medium text-white"
          style={{ background: '#6366F1' }}
        >
          {showSubjectForm ? 'Cancel' : 'Add Subject'}
        </button>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-inter" style={{
          background: msg.startsWith('Error') ? '#FEF2F2' : '#ECFDF5',
          color: msg.startsWith('Error') ? '#991B1B' : '#065F46',
          border: `1px solid ${msg.startsWith('Error') ? '#FECACA' : '#A7F3D0'}`,
        }}>
          {msg}
        </div>
      )}

      {/* Subject Form */}
      {showSubjectForm && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">{editingSubjectId ? 'Edit Video Subject' : 'Add Video Subject'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Name *</label>
              <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Polity" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Icon URL</label>
              <input value={subjectForm.iconUrl} onChange={(e) => setSubjectForm({ ...subjectForm, iconUrl: e.target.value })}
                placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-[#6B7280] mb-1">Description</label>
            <input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              placeholder="Brief description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-[#6B7280] mb-1">Display Order</label>
            <input type="number" value={subjectForm.order} onChange={(e) => setSubjectForm({ ...subjectForm, order: parseInt(e.target.value) || 0 })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveSubject}
              className="px-5 py-2 rounded-lg text-white font-inter font-medium text-sm" style={{ background: '#10B981' }}>
              {editingSubjectId ? 'Save Subject' : 'Create Subject'}
            </button>
            {editingSubjectId && (
              <button onClick={resetSubjectForm}
                className="px-5 py-2 rounded-lg font-inter font-medium text-sm border border-[#D1D5DB] text-[#374151]">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Subjects */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">Subjects ({subjects.length})</h2>
          {loading ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Loading...</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">No subjects yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSubject(s)}
                  className="p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: selectedSubject?.id === s.id ? '#EFF6FF' : '#FAFAFA',
                    border: `1px solid ${selectedSubject?.id === s.id ? '#BFDBFE' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{displaySubjectName(s.name)}</p>
                      <p className="text-xs text-[#6B7280]">{s._count?.videos ?? s.videoCount} videos</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditSubject(s); }}
                        className="text-xs px-2 py-1 rounded text-[#2563EB] hover:bg-[#EFF6FF]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s.id); }}
                        className="text-xs px-2 py-1 rounded text-[#EF4444] hover:bg-[#FEF2F2]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Videos */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-[#111827]">
              {selectedSubject ? `Videos in "${displaySubjectName(selectedSubject.name)}"` : 'Select a subject'}
            </h2>
            {selectedSubject && (
              <button
                onClick={() => setShowVideoForm(!showVideoForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-white"
                style={{ background: '#6366F1' }}
              >
                {showVideoForm ? 'Cancel' : 'Add Video'}
              </button>
            )}
          </div>

          {showVideoForm && selectedSubject && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="space-y-2">
                <input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  placeholder="Video title *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input value={videoForm.instructor} onChange={(e) => setVideoForm({ ...videoForm, instructor: e.target.value })}
                  placeholder="Instructor name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input value={videoForm.videoUrl} onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                  placeholder="YouTube URL (e.g. https://youtu.be/abc123)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input value={videoForm.thumbnailUrl} onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                  placeholder="Thumbnail URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={videoForm.duration} onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                    placeholder="Duration (seconds)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="number" value={videoForm.order} onChange={(e) => setVideoForm({ ...videoForm, order: parseInt(e.target.value) || 0 })}
                    placeholder="Order" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <textarea value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  placeholder="Description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Tags</label>
                  <TagInput tags={videoForm.tags} onChange={(tags) => setVideoForm({ ...videoForm, tags })} />
                </div>
                <button onClick={handleCreateVideo}
                  className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium" style={{ background: '#10B981' }}>
                  Add Video
                </button>
              </div>
            </div>
          )}

          {!selectedSubject ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Click a subject to see its videos.</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">No videos yet.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {videos.map((v: any) => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVideo(v)}
                  className="p-3 rounded-xl cursor-pointer"
                  style={{
                    background: selectedVideo?.id === v.id ? '#FFF7ED' : '#FAFAFA',
                    border: `1px solid ${selectedVideo?.id === v.id ? '#FED7AA' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">{v.title}</p>
                      {v.instructor && <p className="text-xs text-[#6B7280]">by {v.instructor}</p>}
                      {v.duration && <p className="text-xs text-[#9CA3AF]">{Math.floor(v.duration / 60)}m {v.duration % 60}s</p>}
                      {Array.isArray(v.tags) && v.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {v.tags.map((tag: string, i: number) => (
                            <span key={`${tag}-${i}`} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: '#EEF2FF', color: '#4338CA' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteVideo(v.id); }}
                      className="text-xs px-2 py-1 rounded text-[#EF4444] hover:bg-[#FEF2F2] flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Questions for selected video */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-[#111827]">
              {selectedVideo ? `Questions for "${selectedVideo.title.substring(0, 28)}${selectedVideo.title.length > 28 ? '…' : ''}"` : 'Select a video'}
            </h2>
            {selectedVideo && (
              <button
                onClick={() => setShowQuestionForm(!showQuestionForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-white"
                style={{ background: '#F59E0B' }}
              >
                {showQuestionForm ? 'Cancel' : '+ Add Question'}
              </button>
            )}
          </div>

          {/* ── Linked Study Material (references an existing record) ── */}
          {selectedVideo && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <p className="text-xs font-semibold text-[#1E3A8A] mb-1">Study Material PDF</p>
              <p className="text-xs text-[#3B82F6] mb-3">
                Link an existing Study Material record. Its PDF opens from the &quot;Read&quot;
                button on the Video Lectures page - no separate upload, no duplicate copy.
              </p>

              {linkedMaterial ? (
                <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-white" style={{ border: '1px solid #E5E7EB' }}>
                  <span className="text-xs text-[#111827] truncate flex items-center gap-1">
                    📄 {linkedMaterial.file_name}
                    {linkedMaterial.subject && <span className="text-[#9CA3AF]"> · {linkedMaterial.subject}</span>}
                  </span>
                  <button
                    onClick={() => handleLinkMaterial(null)}
                    disabled={linkingMaterialId === '__unlink__'}
                    className="text-xs px-2 py-1 rounded text-[#EF4444] hover:bg-[#FEF2F2] flex-shrink-0 disabled:opacity-50"
                  >
                    {linkingMaterialId === '__unlink__' ? 'Unlinking…' : 'Unlink'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] mb-3">No study material linked yet.</p>
              )}

              <input
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                placeholder="Search study materials by name, subject, topic…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs mb-2"
              />

              {materialsLoading ? (
                <p className="text-xs text-[#6B7280] py-3 text-center">Loading study materials…</p>
              ) : studyMaterials.length === 0 ? (
                <p className="text-xs text-[#6B7280] py-3 text-center">
                  No study materials found. Upload PDFs on the Study Materials page first.
                </p>
              ) : filteredMaterials.length === 0 ? (
                <p className="text-xs text-[#6B7280] py-3 text-center">No materials match &quot;{materialFilter}&quot;.</p>
              ) : (
                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                  {filteredMaterials.map((m) => {
                    const isLinked = linkedMaterial?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isLinked && handleLinkMaterial(m)}
                        disabled={isLinked || linkingMaterialId === m.id}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white disabled:cursor-default hover:bg-[#F0F7FF]"
                        style={{ border: `1px solid ${isLinked ? '#BFDBFE' : '#E5E7EB'}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#111827] truncate">
                            📄 {m.file_name}
                            <span className="text-[#9CA3AF]"> · {m.subject}{m.topic ? ` / ${m.topic}` : ''}</span>
                          </span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: isLinked ? '#2563EB' : '#9CA3AF' }}>
                            {linkingMaterialId === m.id ? 'Linking…' : isLinked ? 'Linked ✓' : 'Link'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Custom Tags (per-video) ── */}
          {selectedVideo && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <p className="text-xs font-semibold text-[#3730A3] mb-1">Tags</p>
              <p className="text-xs text-[#6366F1] mb-3">
                Shown as badges on the Video Lectures cards. Add any custom label.
              </p>
              <TagInput tags={videoTags} onChange={setVideoTags} />
              <button
                onClick={handleSaveVideoTags}
                disabled={savingTags}
                className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-inter font-medium disabled:opacity-50"
                style={{ background: '#6366F1' }}
              >
                {savingTags ? 'Saving…' : 'Save Tags'}
              </button>
            </div>
          )}

          {showQuestionForm && selectedVideo && (
            <div className="mb-4 p-4 rounded-xl space-y-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-medium text-[#92400E] mb-2">New MCQ Question</p>
              <textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="Question text *" rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {(['option0', 'option1', 'option2', 'option3'] as const).map((key, idx) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#6B7280] w-4">{optionLabels[idx]}</span>
                  <input
                    value={questionForm[key]}
                    onChange={(e) => setQuestionForm({ ...questionForm, [key]: e.target.value })}
                    placeholder={`Option ${optionLabels[idx]} *`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Correct Answer *</label>
                <select
                  value={questionForm.correctOption}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctOption: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {optionLabels.map((label, idx) => (
                    <option key={idx} value={idx}>Option {label}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explanation (shown after submission)" rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button onClick={handleCreateQuestion}
                className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium" style={{ background: '#F59E0B' }}>
                Save Question
              </button>
            </div>
          )}

          {!selectedVideo ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Click a video to manage its questions.</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">No questions yet. Add one above.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {questions.map((q: any, idx: number) => (
                <div key={q.id} className="p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#111827] flex-1">
                      <span className="text-[#9CA3AF] mr-1">Q{idx + 1}.</span>
                      {q.question}
                    </p>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-xs px-2 py-1 rounded text-[#EF4444] hover:bg-[#FEF2F2] flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {(q.options as string[]).map((opt: string, i: number) => (
                      <p key={i} className="text-xs px-2 py-1 rounded"
                        style={{
                          background: i === q.correctOption ? '#ECFDF5' : 'transparent',
                          color: i === q.correctOption ? '#065F46' : '#6B7280',
                          fontWeight: i === q.correctOption ? 600 : 400,
                        }}>
                        {optionLabels[i]}. {opt} {i === q.correctOption && '✓'}
                      </p>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-[#6B7280] mt-2 italic">💡 {q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
