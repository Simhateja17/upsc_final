'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

export default function LibraryManager() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', tags: '', order: 0 });
  const [chapterForm, setChapterForm] = useState({ subjectId: '', title: '', description: '', order: 0 });
  const [uploadForm, setUploadForm] = useState<{ file: File | null; title: string; type: string }>({ file: null, title: '', type: 'pdf' });

  const loadSubjects = () => {
    setLoading(true);
    adminService.getLibrarySubjects()
      .then((res) => setSubjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubjects(); }, []);

  const showMessage = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const loadChapters = async (subjectId: string) => {
    try {
      const res = await adminService.getLibraryChapters(subjectId);
      setChapters(res.data || []);
    } catch {
      setChapters([]);
    }
  };

  const loadMaterials = async (chapterId: string) => {
    try {
      const res = await adminService.getLibraryMaterials(chapterId);
      setMaterials(res.data || []);
    } catch {
      setMaterials([]);
    }
  };

  // Subject CRUD
  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim()) {
      showMessage('Error: Name is required');
      return;
    }
    try {
      await adminService.createLibrarySubject({
        name: subjectForm.name,
        description: subjectForm.description,
        tags: subjectForm.tags ? subjectForm.tags.split(',').map((t: string) => t.trim()) : [],
        order: subjectForm.order,
      });
      showMessage('Subject created!');
      setShowSubjectForm(false);
      setSubjectForm({ name: '', description: '', tags: '', order: 0 });
      loadSubjects();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all its chapters/materials?')) return;
    try {
      await adminService.deleteLibrarySubject(id);
      if (selectedSubject?.id === id) { setSelectedSubject(null); setChapters([]); setSelectedChapter(null); setMaterials([]); }
      loadSubjects();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  // Chapter CRUD
  const handleCreateChapter = async () => {
    if (!chapterForm.title.trim() || !selectedSubject) return;
    try {
      await adminService.createLibraryChapter({ ...chapterForm, subjectId: selectedSubject.id });
      showMessage('Chapter created!');
      setShowChapterForm(false);
      setChapterForm({ subjectId: '', title: '', description: '', order: 0 });
      loadChapters(selectedSubject.id);
      loadSubjects();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Delete this chapter and all its materials?')) return;
    try {
      await adminService.deleteLibraryChapter(id);
      if (selectedChapter?.id === id) { setSelectedChapter(null); setMaterials([]); }
      if (selectedSubject) loadChapters(selectedSubject.id);
      loadSubjects();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  // Material upload / delete
  const handleUploadMaterial = async () => {
    if (!uploadForm.file || !uploadForm.title.trim() || !selectedChapter) {
      showMessage('Error: File and title are required');
      return;
    }
    try {
      await adminService.uploadLibraryMaterial(uploadForm.file, selectedChapter.id, uploadForm.title, uploadForm.type);
      showMessage('Material uploaded!');
      setShowUploadForm(false);
      setUploadForm({ file: null, title: '', type: 'pdf' });
      loadMaterials(selectedChapter.id);
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await adminService.deleteLibraryMaterial(id);
      if (selectedChapter) loadMaterials(selectedChapter.id);
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleSelectSubject = (subject: any) => {
    setSelectedSubject(subject);
    setChapters([]);
    setSelectedChapter(null);
    setMaterials([]);
    loadChapters(subject.id);
  };

  const handleSelectChapter = (chapter: any) => {
    setSelectedChapter(chapter);
    setMaterials([]);
    loadMaterials(chapter.id);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-[clamp(1.5rem,2vw,2rem)]">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          Library Manager
        </h1>
        <button
          onClick={() => { setShowSubjectForm(!showSubjectForm); setShowChapterForm(false); setShowUploadForm(false); }}
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

      {showSubjectForm && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">Add Subject</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Name *</label>
              <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Indian Polity" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Tags (comma separated)</label>
              <input value={subjectForm.tags} onChange={(e) => setSubjectForm({ ...subjectForm, tags: e.target.value })}
                placeholder="e.g. GS, Prelims" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-[#6B7280] mb-1">Description</label>
            <input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              placeholder="Brief description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-[#6B7280] mb-1">Display Order</label>
            <input type="number" value={subjectForm.order} onChange={(e) => setSubjectForm({ ...subjectForm, order: parseInt(e.target.value) || 0 })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleCreateSubject}
            className="px-5 py-2 rounded-lg text-white font-inter font-medium text-sm" style={{ background: '#10B981' }}>
            Create Subject
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Subjects */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">Subjects ({subjects.length})</h2>
          {loading ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Loading...</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
                      <p className="text-sm font-medium text-[#111827]">{s.name}</p>
                      <p className="text-xs text-[#6B7280]">{s._count?.chapters ?? 0} chapters</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s.id); }}
                      className="text-xs px-2 py-1 rounded text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Chapters */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-[#111827]">
              {selectedSubject ? `Chapters in "${selectedSubject.name}"` : 'Select a subject'}
            </h2>
            {selectedSubject && (
              <button
                onClick={() => setShowChapterForm(!showChapterForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-white"
                style={{ background: '#6366F1' }}
              >
                {showChapterForm ? 'Cancel' : 'Add Chapter'}
              </button>
            )}
          </div>

          {showChapterForm && selectedSubject && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="space-y-2">
                <input value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  placeholder="Chapter title *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                  placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" value={chapterForm.order} onChange={(e) => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) || 0 })}
                  placeholder="Order" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <button onClick={handleCreateChapter}
                  className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium" style={{ background: '#10B981' }}>
                  Add Chapter
                </button>
              </div>
            </div>
          )}

          {!selectedSubject ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Click a subject to see its chapters.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {chapters.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectChapter(c)}
                  className="p-3 rounded-xl cursor-pointer"
                  style={{
                    background: selectedChapter?.id === c.id ? '#FFF7ED' : '#FAFAFA',
                    border: `1px solid ${selectedChapter?.id === c.id ? '#FED7AA' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827]">{c.title}</p>
                      <p className="text-xs text-[#6B7280]">{c._count?.materials ?? 0} materials</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteChapter(c.id); }}
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

        {/* Column 3: Materials */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-[#111827]">
              {selectedChapter ? `Materials in "${selectedChapter.title}"` : 'Select a chapter'}
            </h2>
            {selectedChapter && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-white"
                style={{ background: '#F59E0B' }}
              >
                {showUploadForm ? 'Cancel' : '+ Upload'}
              </button>
            )}
          </div>

          {showUploadForm && selectedChapter && (
            <div className="mb-4 p-4 rounded-xl space-y-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-medium text-[#92400E] mb-2">Upload Material</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                className="w-full text-sm"
              />
              <input value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Material title *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <select value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="pdf">PDF</option>
                <option value="notes">Notes</option>
              </select>
              <button onClick={handleUploadMaterial}
                className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium" style={{ background: '#F59E0B' }}>
                Upload
              </button>
            </div>
          )}

          {!selectedChapter ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Click a chapter to manage materials.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {materials.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827]">{m.title}</p>
                      <p className="text-xs text-[#6B7280]">
                        {m.type?.toUpperCase()} {formatBytes(m.fileSize)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(m.id)}
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
      </div>
    </div>
  );
}
