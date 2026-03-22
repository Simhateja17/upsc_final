'use client';

import { useEffect, useState, useRef } from 'react';
import { studyMaterialService } from '@/lib/services';

interface Material {
  id: string;
  file_name: string;
  subject: string;
  topic?: string | null;
  source?: string | null;
  status: string;
  chunk_count?: number;
  created_at: string;
}

type Tab = 'study' | 'mock';

export default function StudyMaterialsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('study');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload form state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isStudy = activeTab === 'study';

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = isStudy
        ? await studyMaterialService.list()
        : await studyMaterialService.listMockMaterials();
      setMaterials(res.data || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [activeTab]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject.trim()) {
      setMsg({ type: 'error', text: 'Subject and PDF file are required.' });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const res = isStudy
        ? await studyMaterialService.upload(file, subject.trim(), topic.trim() || undefined, source.trim() || undefined)
        : await studyMaterialService.uploadMockMaterial(file, subject.trim(), topic.trim() || undefined, source.trim() || undefined);
      setMsg({ type: 'success', text: res.message || 'Uploaded! Vectorization started.' });
      setSubject('');
      setTopic('');
      setSource('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      loadMaterials();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material? This will also remove its vectorized chunks.')) return;
    setDeleting(id);
    try {
      isStudy
        ? await studyMaterialService.delete(id)
        : await studyMaterialService.deleteMockMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Delete failed.' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
        <p className="text-gray-500 mt-1">
          Upload PDFs here. They are chunked &amp; vectorized — when a student generates a mock test
          for this subject, Claude uses these chunks to create questions via the RAG pipeline.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([['study', '📚 Study Materials'], ['mock', '📝 Mock Test Materials']] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Upload {isStudy ? 'Study Material' : 'Mock Test Material'}
          </h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. History, Polity, Geography"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic (optional)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Mughal Empire, Fundamental Rights"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source (optional)</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. NCERT Class 12, Laxmikant"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF File <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              {file && (
                <p className="text-xs text-gray-400 mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
              )}
            </div>

            {msg && (
              <div className={`text-sm px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading & vectorizing…' : 'Upload PDF'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>How it works:</strong> PDFs are split into chunks and embedded as vectors in Supabase.
            When a student picks this subject on the Mock Tests page, Claude retrieves the most relevant
            chunks and generates MCQs grounded in your content.
          </div>
        </div>

        {/* Materials Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {isStudy ? 'Study Materials' : 'Mock Test Materials'} ({materials.length})
            </h2>
            <button
              onClick={loadMaterials}
              className="text-xs text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No materials uploaded yet. Upload a PDF to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">File</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Topic</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Chunks</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-[180px] truncate" title={m.file_name}>
                        {m.file_name}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{m.subject}</td>
                      <td className="px-4 py-3 text-gray-500">{m.topic || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.status === 'vectorized'
                              ? 'bg-green-50 text-green-700'
                              : m.status === 'processing'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {m.status === 'vectorized' ? '✓' : m.status === 'processing' ? '⏳' : '✗'}
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.chunk_count ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(m.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
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
      </div>
    </div>
  );
}
