'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

interface ContactSubmission {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContactMessagesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    adminService.getContactSubmissions()
      .then((res) => setSubmissions(res.data || []))
      .catch((err: any) => setMsg(`Error: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggleStatus = async (s: ContactSubmission) => {
    const nextStatus = s.status === 'resolved' ? 'new' : 'resolved';
    try {
      await adminService.updateContactSubmissionStatus(s.id, nextStatus);
      setSubmissions((prev) => prev.map((item) => (item.id === s.id ? { ...item, status: nextStatus } : item)));
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          Contact Messages
        </h1>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-inter ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0F172B] rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-inter">No contact messages yet.</div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className={`bg-white border rounded-xl p-4 shadow-sm ${s.status === 'resolved' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-inter font-semibold text-[#111827] text-sm">
                      {s.firstName} {s.lastName}
                    </p>
                    <a href={`mailto:${s.email}`} className="font-inter text-xs text-[#1D4ED8]">
                      {s.email}
                    </a>
                    {s.userId && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                        Registered user
                      </span>
                    )}
                  </div>
                  <p className="font-inter font-medium text-gray-700 text-sm mt-1">{s.subject}</p>
                  <p className="font-inter text-gray-600 text-sm mt-1 whitespace-pre-wrap">{s.message}</p>
                  <p className="font-inter text-gray-400 text-xs mt-2">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(s)}
                    className={`px-2 py-1 rounded text-xs font-medium ${s.status === 'resolved' ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  >
                    {s.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
