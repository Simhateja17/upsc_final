'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

interface TagItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string | null;
  order: number;
  isActive: boolean;
}

// Suggestions only - admins are NOT limited to these. They can type any custom tag.
const SUGGESTIONS = ['Popular', 'New', 'PDF Included', 'Trending', 'Revision', 'Beginner'];

const PRESET_COLORS = ['#1D4ED8', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4B5563'];

const emptyForm = { name: '', color: '#1D4ED8', description: '', order: 0, isActive: true };

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    adminService.getTags()
      .then((res) => setTags(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleSubmit = async () => {
    setMsg('');
    if (!form.name.trim()) {
      setMsg('Error: Tag name is required.');
      return;
    }
    try {
      if (editing) {
        await adminService.updateTag(editing.id, form);
        setMsg('Tag updated!');
      } else {
        await adminService.createTag(form);
        setMsg('Tag created!');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (t: TagItem) => {
    setEditing(t);
    setForm({
      name: t.name,
      color: t.color,
      description: t.description || '',
      order: t.order,
      isActive: t.isActive,
    });
    setShowForm(true);
    setMsg('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await adminService.deleteTag(id);
      load();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleToggleActive = async (t: TagItem) => {
    try {
      await adminService.updateTag(t.id, { isActive: !t.isActive });
      load();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          Custom Tags
        </h1>
        <button
          onClick={() => { resetForm(); setMsg(''); setShowForm(!showForm); }}
          className="px-4 py-2 bg-[#101828] text-white rounded-lg font-inter font-medium text-sm hover:bg-[#1E2875] transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Tag'}
        </button>
      </div>
      <p className="font-inter text-gray-500 text-sm mb-6">
        Create your own tags manually. You are not limited to predefined options - type any label you need.
      </p>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-inter ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Popular, PDF Included, or any custom label"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            {!editing && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-400 mr-1">Suggestions:</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, name: s })}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  aria-label={`Select color ${c}`}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-9 h-9 p-0 border border-gray-300 rounded-lg cursor-pointer bg-white"
                title="Custom color"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short note on when to use this tag"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${form.color}1A`, color: form.color, border: `1px solid ${form.color}55` }}
            >
              {form.name.trim() || 'Tag preview'}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-[#101828] text-white rounded-lg font-inter font-medium text-sm hover:bg-[#1E2875] transition-colors"
            >
              {editing ? 'Update Tag' : 'Create Tag'}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-inter font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0F172B] rounded-full animate-spin" />
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-inter">No tags yet. Click {'"'}Add Tag{'"'} to create one.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
          {tags.map((t) => (
            <div key={t.id} className={`flex items-center justify-between gap-4 p-4 transition-opacity ${t.isActive ? '' : 'opacity-50'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ background: `${t.color}1A`, color: t.color, border: `1px solid ${t.color}55` }}
                >
                  {t.name}
                </span>
                {t.description && (
                  <span className="font-inter text-gray-500 text-sm truncate">{t.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(t)}
                  className={`px-2 py-1 rounded text-xs font-medium ${t.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {t.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleEdit(t)}
                  className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
