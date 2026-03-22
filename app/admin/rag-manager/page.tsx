'use client';

import { useEffect, useState, useRef } from 'react';
import { studyMaterialService } from '@/lib/services';

type MaterialType = 'study' | 'mock';
type StatusFilter = 'all' | 'processing' | 'vectorized' | 'failed';
type TypeFilter = 'all' | 'study' | 'mock';

interface Material {
  id: string;
  file_name: string;
  subject: string;
  topic?: string | null;
  source?: string | null;
  status: string;
  chunk_count?: number;
  created_at: string;
  type: MaterialType;
}

export default function RAGManagerPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [subjectSearch, setSubjectSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // Upload form
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadTopic, setUploadTopic] = useState('');
  const [uploadSource, setUploadSource] = useState('');
  const [uploadType, setUploadType] = useState<MaterialType>('study');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(true);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const [studyRes, mockRes] = await Promise.allSettled([
        studyMaterialService.list(),
        studyMaterialService.listMockMaterials(),
      ]);

      const studyItems: Material[] = (studyRes.status === 'fulfilled' ? studyRes.value.data || [] : []).map(
        (m: any) => ({ ...m, type: 'study' as MaterialType })
      );
      const mockItems: Material[] = (mockRes.status === 'fulfilled' ? mockRes.value.data || [] : []).map(
        (m: any) => ({ ...m, type: 'mock' as MaterialType })
      );

      const merged = [...studyItems, ...mockItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMaterials(merged);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadSubject.trim()) {
      setMsg({ type: 'error', text: 'Subject and PDF file are required.' });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const res = uploadType === 'study'
        ? await studyMaterialService.upload(uploadFile, uploadSubject.trim(), uploadTopic.trim() || undefined, uploadSource.trim() || undefined)
        : await studyMaterialService.uploadMockMaterial(uploadFile, uploadSubject.trim(), uploadTopic.trim() || undefined, uploadSource.trim() || undefined);
      setMsg({ type: 'success', text: res.message || 'Uploaded! Vectorization started in background.' });
      setUploadSubject('');
      setUploadTopic('');
      setUploadSource('');
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = '';
      loadMaterials();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Delete "${material.file_name}"? This will also remove its vectorized chunks.`)) return;
    setDeleting(material.id);
    try {
      if (material.type === 'study') {
        await studyMaterialService.delete(material.id);
      } else {
        await studyMaterialService.deleteMockMaterial(material.id);
      }
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Delete failed.' });
    } finally {
      setDeleting(null);
    }
  };

  const filtered = materials.filter((m) => {
    const matchSubject = !subjectSearch || m.subject.toLowerCase().includes(subjectSearch.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSubject && matchStatus && matchType;
  });

  const vectorizedCount = materials.filter((m) => m.status === 'vectorized').length;
  const processingCount = materials.filter((m) => m.status === 'processing').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RAG Manager</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Upload PDFs to create knowledge chunks. Powers both{' '}
            <span className="font-medium text-blue-600">Mock Test generation</span> and{' '}
            <span className="font-medium text-purple-600">Jeet GPT responses</span>.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <div className="font-bold text-green-700 text-lg">{vectorizedCount}</div>
            <div className="text-green-600 text-xs">Vectorized</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-center">
            <div className="font-bold text-orange-700 text-lg">{processingCount}</div>
            <div className="text-orange-600 text-xs">Processing</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
            <div className="font-bold text-gray-700 text-lg">{materials.length}</div>
            <div className="text-gray-500 text-xs">Total</div>
          </div>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
        <button
          onClick={() => setUploadPanelOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">Upload New Material</span>
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">PDF only</span>
          </div>
          <span className="text-gray-400 text-lg">{uploadPanelOpen ? '▲' : '▼'}</span>
        </button>

        {uploadPanelOpen && (
          <form onSubmit={handleUpload} className="px-5 pb-5 border-t border-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  placeholder="e.g. Polity, History, Geography"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Topic (optional)</label>
                <input
                  type="text"
                  value={uploadTopic}
                  onChange={(e) => setUploadTopic(e.target.value)}
                  placeholder="e.g. Fundamental Rights"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Source (optional)</label>
                <input
                  type="text"
                  value={uploadSource}
                  onChange={(e) => setUploadSource(e.target.value)}
                  placeholder="e.g. Laxmikant, NCERT"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Material Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as MaterialType)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="study">Study Material</option>
                  <option value="mock">Mock Test Material</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  PDF File <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                {uploadFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    {uploadFile.name} &nbsp;·&nbsp; {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {uploading ? 'Uploading…' : 'Upload & Vectorize'}
              </button>
            </div>

            {msg && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg.text}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by subject…"
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="vectorized">Vectorized</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Types</option>
          <option value="study">Study Material</option>
          <option value="mock">Mock Test Material</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} of {materials.length} materials
        </span>
        <button
          onClick={loadMaterials}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {materials.length === 0
              ? 'No materials uploaded yet. Upload a PDF to get started.'
              : 'No materials match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">File Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Topic</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Chunks</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Uploaded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m) => (
                  <tr key={`${m.type}-${m.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 max-w-[220px]">
                      <span className="block truncate text-gray-800 font-medium" title={m.file_name}>
                        {m.file_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.subject}</td>
                    <td className="px-4 py-3 text-gray-500">{m.topic || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{m.source || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.type === 'study' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {m.type === 'study' ? '📚 Study' : '📝 Mock Test'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === 'vectorized'
                          ? 'bg-green-50 text-green-700'
                          : m.status === 'processing'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {m.status === 'vectorized' ? '✓' : m.status === 'processing' ? '⏳' : '✗'}
                        {' '}{m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {m.chunk_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={deleting === m.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
                      >
                        {deleting === m.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <strong>How RAG works:</strong> Uploaded PDFs are split into ~1000-char chunks and embedded as 1536-dim vectors (Gemini).
        When a student asks Jeet GPT a question or generates a mock test, the system finds the most similar chunks via cosine search
        and injects them as context — grounding AI responses in your actual study material.
      </div>
    </div>
  );
}
