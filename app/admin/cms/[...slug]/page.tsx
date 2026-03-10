'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/lib/services';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false });

interface Section {
  id: string;
  key: string;
  type: string;
  content: string;
  order: number;
  isActive: boolean;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isPublished: boolean;
  sections: Section[];
}

export default function CmsPageEditor() {
  const params = useParams();
  const router = useRouter();
  // catch-all slug: ['dashboard', 'daily-mcq'] -> 'dashboard/daily-mcq'
  const slugParts = params.slug as string[];
  const slug = slugParts.map(decodeURIComponent).join('/');

  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSections, setEditedSections] = useState<Record<string, Partial<Section>>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSection, setNewSection] = useState({ key: '', type: 'text', content: '' });
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      const res = await adminService.getCmsPage(slug);
      setPage(res.data);
    } catch (err) {
      console.error('Failed to load page:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSectionLocally = useCallback((id: string, field: string, value: any) => {
    setEditedSections((prev) => ({
      ...prev,
      [id]: { ...prev[id], id, [field]: value },
    }));
  }, []);

  const saveSection = async (section: Section) => {
    const edits = editedSections[section.id];
    if (!edits) return;

    setSaving(true);
    try {
      await adminService.updateCmsSection(section.id, edits);
      setEditedSections((prev) => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      await loadPage();
      showMsg('Section saved!');
    } catch (err) {
      console.error('Save failed:', err);
      showMsg('Save failed!');
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    const edits = Object.values(editedSections);
    if (edits.length === 0) return;

    setSaving(true);
    try {
      await adminService.bulkUpdateCmsSections(slug, edits as any[]);
      setEditedSections({});
      await loadPage();
      showMsg(`Saved ${edits.length} sections!`);
    } catch (err) {
      console.error('Bulk save failed:', err);
      showMsg('Save failed!');
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    if (!page || !newSection.key) return;
    setSaving(true);
    try {
      await adminService.createCmsSection({
        pageId: page.id,
        key: newSection.key,
        type: newSection.type,
        content: newSection.content,
      });
      setNewSection({ key: '', type: 'text', content: '' });
      setShowAddForm(false);
      await loadPage();
      showMsg('Section added!');
    } catch (err: any) {
      showMsg(err.message || 'Failed to add section');
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Delete this section? This cannot be undone.')) return;
    try {
      await adminService.deleteCmsSection(id);
      await loadPage();
      showMsg('Section deleted');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const showMsg = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const getCurrentContent = (section: Section) => {
    return editedSections[section.id]?.content ?? section.content;
  };

  const isJsonValid = (str: string) => {
    try { JSON.parse(str); return true; } catch { return false; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg mb-4">Page not found</p>
        <button onClick={() => router.push('/admin/cms')} className="text-blue-500 hover:underline">
          Back to Pages
        </button>
      </div>
    );
  }

  const hasEdits = Object.keys(editedSections).length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/cms')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
            <p className="text-sm text-gray-400 font-mono">/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            + Add Section
          </button>
          {hasEdits && (
            <button
              onClick={saveAll}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : `Save All (${Object.keys(editedSections).length})`}
            </button>
          )}
        </div>
      </div>

      {/* Add Section Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-5 border border-blue-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Key</label>
              <input
                type="text"
                value={newSection.key}
                onChange={(e) => setNewSection({ ...newSection, key: e.target.value })}
                placeholder="e.g. hero_title"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Type</label>
              <select
                value={newSection.type}
                onChange={(e) => setNewSection({ ...newSection, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Text</option>
                <option value="richtext">Rich Text</option>
                <option value="json">JSON</option>
                <option value="image">Image URL</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={addSection}
                disabled={!newSection.key || saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {page.sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const isEdited = !!editedSections[section.id];
          const content = getCurrentContent(section);

          return (
            <div
              key={section.id}
              className={`bg-white rounded-xl border transition-all ${
                isEdited ? 'border-blue-200 shadow-sm' : 'border-gray-100'
              }`}
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    {section.key}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      section.type === 'json'
                        ? 'bg-purple-50 text-purple-600'
                        : section.type === 'richtext'
                        ? 'bg-blue-50 text-blue-600'
                        : section.type === 'image'
                        ? 'bg-orange-50 text-orange-600'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {section.type}
                  </span>
                  {isEdited && (
                    <span className="text-xs text-blue-500 font-medium">Modified</span>
                  )}
                  {!section.isActive && (
                    <span className="text-xs text-red-400 font-medium">Inactive</span>
                  )}
                </div>
                <span className="text-gray-300 text-sm">{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Content Preview (collapsed) */}
              {!isExpanded && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-500 truncate">
                    {section.type === 'json'
                      ? (() => {
                          try {
                            const parsed = JSON.parse(content);
                            return Array.isArray(parsed)
                              ? `[Array: ${parsed.length} items]`
                              : `{Object: ${Object.keys(parsed).length} keys}`;
                          } catch {
                            return content.slice(0, 100);
                          }
                        })()
                      : content.slice(0, 150)}
                  </p>
                </div>
              )}

              {/* Expanded Editor */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="pt-4">
                    {section.type === 'richtext' ? (
                      <RichTextEditor
                        content={content}
                        onChange={(html) => updateSectionLocally(section.id, 'content', html)}
                      />
                    ) : section.type === 'json' ? (
                      <div>
                        <textarea
                          value={
                            isEdited && editedSections[section.id]?.content !== undefined
                              ? editedSections[section.id].content!
                              : (() => {
                                  try { return JSON.stringify(JSON.parse(content), null, 2); }
                                  catch { return content; }
                                })()
                          }
                          onChange={(e) =>
                            updateSectionLocally(section.id, 'content', e.target.value)
                          }
                          className={`w-full font-mono text-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] ${
                            !isJsonValid(editedSections[section.id]?.content ?? content)
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                        {!isJsonValid(editedSections[section.id]?.content ?? content) && (
                          <p className="text-xs text-red-500 mt-1">Invalid JSON</p>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={content}
                        onChange={(e) =>
                          updateSectionLocally(section.id, 'content', e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      />
                    )}

                    {/* Section Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center gap-2 text-sm text-gray-500">
                        <input
                          type="checkbox"
                          checked={editedSections[section.id]?.isActive ?? section.isActive}
                          onChange={(e) =>
                            updateSectionLocally(section.id, 'isActive', e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        Active
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="px-3 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                        {isEdited && (
                          <button
                            onClick={() => saveSection(section)}
                            disabled={saving}
                            className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {page.sections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No sections yet. Click &quot;Add Section&quot; to create one.
        </div>
      )}
    </div>
  );
}
