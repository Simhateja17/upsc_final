'use client';

import { useEffect, useState } from 'react';
import { testSeriesService } from '@/lib/services';

interface SeriesItem {
  id: string;
  title: string;
  description: string;
  examMode: string;
  subject?: string | null;
  difficulty: string;
  totalTests: number;
  questionsPerTest: number;
  price: number;
  isActive?: boolean;
  enrollmentCount?: number;
  createdAt?: string;
}

const emptyForm: Omit<SeriesItem, 'id' | 'enrollmentCount' | 'createdAt'> = {
  title: '',
  description: '',
  examMode: 'prelims',
  subject: '',
  difficulty: 'medium',
  totalTests: 10,
  questionsPerTest: 20,
  price: 0,
  isActive: true,
};

export default function AdminTestSeriesPage() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [msg, setMsg] = useState('');

  async function loadSeries() {
    setLoading(true);
    try {
      const res = await testSeriesService.listSeries();
      if (res.data) setSeries(res.data as SeriesItem[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSeries(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setMsg('');
  }

  function openEdit(s: SeriesItem) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      description: s.description,
      examMode: s.examMode,
      subject: s.subject ?? '',
      difficulty: s.difficulty,
      totalTests: s.totalTests,
      questionsPerTest: s.questionsPerTest,
      price: s.price,
      isActive: s.isActive ?? true,
    });
    setShowForm(true);
    setMsg('');
  }

  async function handleSave() {
    if (!form.title || !form.description) {
      setMsg('Title and description are required.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const payload = { ...form, subject: form.subject || null };
      if (editingId) {
        await testSeriesService.updateSeries(editingId, payload);
        setMsg('Series updated successfully.');
      } else {
        await testSeriesService.createSeries(payload);
        setMsg('Series created successfully.');
      }
      await loadSeries();
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setMsg(err.message || 'Failed to save series.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this test series? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await testSeriesService.deleteSeries(id);
      await loadSeries();
    } catch (err: any) {
      setMsg(err.message || 'Failed to delete series.');
    } finally {
      setDeleting(null);
    }
  }

  const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 13,
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
    fontFamily: 'Inter, sans-serif',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 24, color: '#111827', margin: 0 }}>🏆 Test Series</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Create and manage test series programs</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          + New Series
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.includes('success') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('success') ? '#065F46' : '#991B1B', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111827', margin: '0 0 20px' }}>
            {editingId ? 'Edit Series' : 'Create New Series'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Prelims Assault 2026" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description *</label>
              <textarea
                style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what this series covers..."
              />
            </div>
            <div>
              <label style={labelStyle}>Exam Mode</label>
              <select style={inputStyle} value={form.examMode} onChange={e => setForm(f => ({ ...f, examMode: e.target.value }))}>
                <option value="prelims">Prelims</option>
                <option value="mains">Mains</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject (optional)</label>
              <input style={inputStyle} value={form.subject ?? ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. History, Geography (leave blank for all)" />
            </div>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select style={inputStyle} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Total Tests</label>
              <input style={inputStyle} type="number" min={1} value={form.totalTests} onChange={e => setForm(f => ({ ...f, totalTests: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Questions per Test</label>
              <input style={inputStyle} type="number" min={1} max={100} value={form.questionsPerTest} onChange={e => setForm(f => ({ ...f, questionsPerTest: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Price (₹, 0 = Free)</label>
              <input style={inputStyle} type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive ?? true}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="isActive" style={{ ...labelStyle, margin: 0 }}>Active (visible to users)</label>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ background: saving ? '#6B7280' : '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : (editingId ? 'Update Series' : 'Create Series')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Series Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>Loading series...</div>
      ) : series.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No test series yet</div>
          <div style={{ fontSize: 13 }}>Click "New Series" to create the first one.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Title', 'Mode', 'Subject', 'Difficulty', 'Tests', 'Q/Test', 'Price', 'Enrolled', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.id} style={{ opacity: s.isActive === false ? 0.5 : 1 }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</div>
                  </td>
                  <td style={cellStyle}><span style={{ background: s.examMode === 'prelims' ? '#D1FAE5' : '#DBEAFE', color: s.examMode === 'prelims' ? '#065F46' : '#1447E6', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{s.examMode}</span></td>
                  <td style={cellStyle}>{s.subject || <span style={{ color: '#9CA3AF' }}>All</span>}</td>
                  <td style={cellStyle}>{s.difficulty}</td>
                  <td style={cellStyle}>{s.totalTests}</td>
                  <td style={cellStyle}>{s.questionsPerTest}</td>
                  <td style={cellStyle}>{s.price === 0 ? <span style={{ color: '#065F46', fontWeight: 600 }}>Free</span> : `₹${s.price}`}</td>
                  <td style={cellStyle}>{s.enrollmentCount ?? 0}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: deleting === s.id ? 'not-allowed' : 'pointer' }}
                      >
                        {deleting === s.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
