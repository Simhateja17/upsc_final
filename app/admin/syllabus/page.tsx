'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

const STAGES = ['prelims', 'mains', 'optional'];

export default function SyllabusManager() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showSubTopicForm, setShowSubTopicForm] = useState(false);

  const [subjectForm, setSubjectForm] = useState({ stage: 'prelims', name: '', short: '', icon: '', color: '', bg: '', sortOrder: 0 });
  const [topicForm, setTopicForm] = useState({ subjectId: '', name: '', sortOrder: 0 });
  const [subTopicForm, setSubTopicForm] = useState({ topicId: '', name: '', sortOrder: 0 });

  const load = () => {
    setLoading(true);
    adminService.getSyllabusSubjects()
      .then((res) => setSubjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showMessage = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  // Subject CRUD
  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim() || !subjectForm.short.trim()) {
      showMessage('Error: Name and short code are required');
      return;
    }
    try {
      await adminService.createSyllabusSubject(subjectForm);
      showMessage('Subject created!');
      setShowSubjectForm(false);
      setSubjectForm({ stage: 'prelims', name: '', short: '', icon: '', color: '', bg: '', sortOrder: 0 });
      load();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all its topics/sub-topics?')) return;
    try {
      await adminService.deleteSyllabusSubject(id);
      if (selectedSubject?.id === id) { setSelectedSubject(null); setSelectedTopic(null); }
      load();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  // Topic CRUD
  const handleCreateTopic = async () => {
    if (!topicForm.name.trim() || !selectedSubject) return;
    try {
      await adminService.createSyllabusTopic({ ...topicForm, subjectId: selectedSubject.id });
      showMessage('Topic created!');
      setShowTopicForm(false);
      setTopicForm({ subjectId: '', name: '', sortOrder: 0 });
      load();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Delete this topic and all its sub-topics?')) return;
    try {
      await adminService.deleteSyllabusTopic(id);
      if (selectedTopic?.id === id) setSelectedTopic(null);
      load();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  // Sub-topic CRUD
  const handleCreateSubTopic = async () => {
    if (!subTopicForm.name.trim() || !selectedTopic) return;
    try {
      await adminService.createSyllabusSubTopic({ ...subTopicForm, topicId: selectedTopic.id });
      showMessage('Sub-topic created!');
      setShowSubTopicForm(false);
      setSubTopicForm({ topicId: '', name: '', sortOrder: 0 });
      load();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteSubTopic = async (id: string) => {
    if (!confirm('Delete this sub-topic?')) return;
    try {
      await adminService.deleteSyllabusSubTopic(id);
      load();
    } catch (err: any) {
      showMessage(`Error: ${err.message}`);
    }
  };

  const handleSelectSubject = (subject: any) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setTopicForm(f => ({ ...f, subjectId: subject.id }));
  };

  const handleSelectTopic = (topic: any) => {
    setSelectedTopic(topic);
    setSubTopicForm(f => ({ ...f, topicId: topic.id }));
  };

  const groupedSubjects = STAGES.map(stage => ({
    stage,
    items: subjects.filter((s: any) => s.stage === stage),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-[clamp(1.5rem,2vw,2rem)]">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          Syllabus Manager
        </h1>
        <button
          onClick={() => { setShowSubjectForm(!showSubjectForm); setShowTopicForm(false); setShowSubTopicForm(false); }}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Stage *</label>
              <select value={subjectForm.stage} onChange={(e) => setSubjectForm({ ...subjectForm, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Name *</label>
              <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Indian Polity" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#6B7280] mb-1">Short Code *</label>
              <input value={subjectForm.short} onChange={(e) => setSubjectForm({ ...subjectForm, short: e.target.value })}
                placeholder="e.g. Polity" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input value={subjectForm.icon} onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}
              placeholder="Icon emoji" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={subjectForm.color} onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
              placeholder="Color hex" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={subjectForm.bg} onChange={(e) => setSubjectForm({ ...subjectForm, bg: e.target.value })}
              placeholder="Bg hex" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="number" value={subjectForm.sortOrder} onChange={(e) => setSubjectForm({ ...subjectForm, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="Order" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleCreateSubject}
            className="px-5 py-2 rounded-lg text-white font-inter font-medium text-sm" style={{ background: '#10B981' }}>
            Create Subject
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Subjects by Stage */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="font-inter font-semibold text-[#111827] mb-4">Subjects ({subjects.length})</h2>
          {loading ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Loading...</p>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {groupedSubjects.map(({ stage, items }) => (
                <div key={stage}>
                  <div className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">{stage}</div>
                  <div className="space-y-2">
                    {items.map((s: any) => (
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
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{s.icon || '📚'}</span>
                            <div>
                              <p className="text-sm font-medium text-[#111827]">{s.name}</p>
                              <p className="text-xs text-[#6B7280]">{s.topics?.length || 0} topics</p>
                            </div>
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Topics */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-[#111827]">
              {selectedSubject ? `Topics in "${selectedSubject.name}"` : 'Select a subject'}
            </h2>
            {selectedSubject && (
              <button
                onClick={() => setShowTopicForm(!showTopicForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-white"
                style={{ background: '#6366F1' }}
              >
                {showTopicForm ? 'Cancel' : 'Add Topic'}
              </button>
            )}
          </div>

          {showTopicForm && selectedSubject && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="space-y-2">
                <input value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  placeholder="Topic name *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" value={topicForm.sortOrder} onChange={(e) => setTopicForm({ ...topicForm, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="Order" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <button onClick={handleCreateTopic}
                  className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium" style={{ background: '#10B981' }}>
                  Add Topic
                </button>
              </div>
            </div>
          )}

          {!selectedSubject ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Click a subject to see its topics.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {(selectedSubject.topics || []).map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTopic(t)}
                  className="p-3 rounded-xl cursor-pointer"
                  style={{
                    background: selectedTopic?.id === t.id ? '#FFF7ED' : '#FAFAFA',
                    border: `1px solid ${selectedTopic?.id === t.id ? '#FED7AA' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827]">{t.name}</p>
                      <p className="text-xs text-[#6B7280]">{t.subTopics?.length || 0} sub-topics</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id); }}
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

        {/* Column 3: Sub-topics */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-[#111827]">
              {selectedTopic ? `Sub-topics in "${selectedTopic.name}"` : 'Select a topic'}
            </h2>
            {selectedTopic && (
              <button
                onClick={() => setShowSubTopicForm(!showSubTopicForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-white"
                style={{ background: '#F59E0B' }}
              >
                {showSubTopicForm ? 'Cancel' : '+ Add Sub-topic'}
              </button>
            )}
          </div>

          {showSubTopicForm && selectedTopic && (
            <div className="mb-4 p-4 rounded-xl space-y-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-medium text-[#92400E] mb-2">New Sub-topic</p>
              <input value={subTopicForm.name} onChange={(e) => setSubTopicForm({ ...subTopicForm, name: e.target.value })}
                placeholder="Sub-topic name *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" value={subTopicForm.sortOrder} onChange={(e) => setSubTopicForm({ ...subTopicForm, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="Order" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button onClick={handleCreateSubTopic}
                className="px-4 py-2 rounded-lg text-white text-sm font-inter font-medium" style={{ background: '#F59E0B' }}>
                Add Sub-topic
              </button>
            </div>
          )}

          {!selectedTopic ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">Click a topic to manage sub-topics.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {(selectedTopic.subTopics || []).map((st: any, idx: number) => (
                <div key={st.id} className="p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#111827] flex-1">
                      <span className="text-[#9CA3AF] mr-1">{idx + 1}.</span>
                      {st.name}
                    </p>
                    <button
                      onClick={() => handleDeleteSubTopic(st.id)}
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
