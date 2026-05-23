'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/lib/services';

type Material = {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  accessLevel: string;
  isPublished: boolean;
  fileSize?: number | null;
  order?: number;
};

type Topic = {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { studyMaterials: number };
};

type SubSubject = {
  id: string;
  name: string;
  sortOrder: number;
  subTopics: Topic[];
};

type Subject = {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  topics: SubSubject[];
  pdfCount: number;
};

const MATERIAL_TYPES = ['Notes', 'PYQ Notes', 'Revision', 'Current Affairs', 'Other'];
const ACCESS_LEVELS = [
  { value: 'free', label: 'Free' },
  { value: 'trial', label: 'Trial' },
  { value: 'paid', label: 'Paid' },
];

export default function LibraryManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSubSubjectId, setSelectedSubSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    file: null as File | null,
    title: '',
    type: 'Notes',
    description: '',
    accessLevel: 'free',
    isPublished: true,
    order: 0,
  });

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );
  const selectedSubSubject = useMemo(
    () => selectedSubject?.topics.find((topic) => topic.id === selectedSubSubjectId) || null,
    [selectedSubject, selectedSubSubjectId]
  );
  const selectedTopic = useMemo(
    () => selectedSubSubject?.subTopics.find((topic) => topic.id === selectedTopicId) || null,
    [selectedSubSubject, selectedTopicId]
  );

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadTree = async () => {
    setLoading(true);
    try {
      const res = await adminService.getLibraryTree('prelims');
      const data = res.data || [];
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId((prev) => prev || data[0].id);
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to load library syllabus.');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (topicId: string) => {
    setMaterialsLoading(true);
    try {
      const res = await adminService.getLibraryMaterials(topicId);
      setMaterials(res.data || []);
    } catch {
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const firstSubSubject = selectedSubject?.topics?.[0];
    setSelectedSubSubjectId(firstSubSubject?.id || '');
  }, [selectedSubjectId, selectedSubject]);

  useEffect(() => {
    const firstTopic = selectedSubSubject?.subTopics?.[0];
    setSelectedTopicId(firstTopic?.id || '');
  }, [selectedSubSubjectId, selectedSubSubject]);

  useEffect(() => {
    if (selectedTopicId) {
      loadMaterials(selectedTopicId);
    } else {
      setMaterials([]);
    }
  }, [selectedTopicId]);

  const handleUpload = async () => {
    if (!selectedTopic || !form.file || !form.title.trim()) {
      showMessage('error', 'Select a topic, choose a PDF, and enter a title.');
      return;
    }
    if (form.file.type !== 'application/pdf') {
      showMessage('error', 'Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    try {
      await adminService.uploadLibraryMaterial(form.file, selectedTopic.id, form.title.trim(), form.type, {
        description: form.description.trim() || undefined,
        accessLevel: form.accessLevel,
        isPublished: form.isPublished,
        order: form.order,
      });
      showMessage('success', 'PDF uploaded to this topic.');
      setForm({ file: null, title: '', type: 'Notes', description: '', accessLevel: 'free', isPublished: true, order: 0 });
      await loadMaterials(selectedTopic.id);
      await loadTree();
    } catch (err: any) {
      showMessage('error', err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Delete this PDF from the library?')) return;
    try {
      await adminService.deleteLibraryMaterial(id);
      setMaterials((prev) => prev.filter((material) => material.id !== id));
      await loadTree();
    } catch (err: any) {
      showMessage('error', err.message || 'Delete failed.');
    }
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
            Library Manager
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Upload student-facing PDFs against the Prelims syllabus. These files do not enter the RAG pipeline.
          </p>
        </div>
        <button
          onClick={loadTree}
          className="px-4 py-2 rounded-lg text-sm font-inter font-medium text-white"
          style={{ background: '#17223E' }}
        >
          Refresh
        </button>
      </div>

      {msg && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm font-inter"
          style={{
            background: msg.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            color: msg.type === 'error' ? '#991B1B' : '#065F46',
            border: `1px solid ${msg.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[300px_340px_1fr] gap-6">
        <section className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">Subjects</h2>
          {loading ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Loading syllabus...</p>
          ) : (
            <div className="space-y-2 max-h-[640px] overflow-y-auto">
              {subjects.map((subject) => {
                const selected = subject.id === selectedSubjectId;
                return (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubjectId(subject.id)}
                    className="w-full p-3 rounded-xl text-left transition-colors"
                    style={{
                      background: selected ? '#EFF6FF' : '#FAFAFA',
                      border: `1px solid ${selected ? '#BFDBFE' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{subject.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{subject.name}</p>
                        <p className="text-xs text-[#6B7280]">{subject.topics.length} sub-subjects · {subject.pdfCount} PDFs</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">
            {selectedSubject ? `${selectedSubject.name} Syllabus` : 'Select a subject'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Sub-subject</label>
              <select
                value={selectedSubSubjectId}
                onChange={(event) => setSelectedSubSubjectId(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!selectedSubject}
              >
                {(selectedSubject?.topics || []).map((subSubject) => (
                  <option key={subSubject.id} value={subSubject.id}>{subSubject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Topic</label>
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {(selectedSubSubject?.subTopics || []).map((topic) => {
                  const selected = topic.id === selectedTopicId;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className="w-full p-3 rounded-xl text-left"
                      style={{
                        background: selected ? '#FFF7ED' : '#FAFAFA',
                        border: `1px solid ${selected ? '#FED7AA' : 'transparent'}`,
                      }}
                    >
                      <p className="text-sm font-medium text-[#111827]">{topic.name}</p>
                      <p className="text-xs text-[#6B7280]">{topic._count?.studyMaterials ?? 0} PDFs</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-inter font-semibold text-[#111827]">
                {selectedTopic ? selectedTopic.name : 'Select a topic'}
              </h2>
              {selectedSubSubject && <p className="text-xs text-[#6B7280] mt-1">{selectedSubSubject.name}</p>}
            </div>
          </div>

          {selectedTopic && (
            <div className="mb-5 p-4 rounded-xl space-y-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-medium text-[#92400E]">Upload PDF</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })}
                  className="w-full text-sm"
                />
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="PDF title *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {MATERIAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select
                  value={form.accessLevel}
                  onChange={(event) => setForm({ ...form, accessLevel: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {ACCESS_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input
                  type="number"
                  value={form.order}
                  onChange={(event) => setForm({ ...form, order: parseInt(event.target.value, 10) || 0 })}
                  placeholder="Display order"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-[#374151]">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                  />
                  Published
                </label>
              </div>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[72px]"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium disabled:opacity-60"
                style={{ background: '#F59E0B' }}
              >
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
            </div>
          )}

          {materialsLoading ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Loading PDFs...</p>
          ) : materials.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">No PDFs uploaded for this topic yet.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {materials.map((material) => (
                <div key={material.id} className="p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827]">{material.title}</p>
                      <p className="text-xs text-[#6B7280]">
                        {material.type} · {material.accessLevel} · {material.isPublished ? 'Published' : 'Draft'} {formatBytes(material.fileSize)}
                      </p>
                      {material.description && <p className="text-xs text-[#6B7280] mt-1">{material.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-xs px-2 py-1 rounded text-[#EF4444] hover:bg-[#FEF2F2] flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
