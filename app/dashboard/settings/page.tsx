'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

type TabId = 'profile' | 'security' | 'notifications' | 'preferences' | 'privacy';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: '🗂️' },
  { id: 'security',      label: 'Security',      icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'preferences',   label: 'Preferences',   icon: '🐾' },
  { id: 'privacy',       label: 'Privacy',       icon: '🛡️' },
];

const inp =
  'w-full h-[48px] rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-[15px] text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#162456] focus:ring-2 focus:ring-[#162456]/10 transition';
const lbl = 'block text-[14px] font-semibold text-[#344054] mb-1.5';
const primaryBtn =
  'inline-flex h-[44px] items-center justify-center rounded-[10px] bg-[#162456] px-6 text-[15px] font-semibold text-white hover:bg-[#1D326E] disabled:opacity-60 disabled:cursor-not-allowed transition';
const cardStyle = { boxShadow: '0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.06)' };

function Toggle({ on, toggle }: { on: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative flex-shrink-0 h-[30px] w-[54px] rounded-full transition-colors ${on ? 'bg-[#162456]' : 'bg-[#D0D5DD]'}`}
    >
      <span
        className={`absolute top-[4px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all ${on ? 'left-[28px]' : 'left-[4px]'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<TabId>('profile');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [retentionChoice, setRetentionChoice] = useState('');

  // Profile
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [bio,       setBio]       = useState('');

  // Security
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Notifications
  const [nMcq,    setNMcq]    = useState(true);
  const [nAnswer, setNAnswer] = useState(true);
  const [nDigest, setNDigest] = useState(true);
  const [nStreak, setNStreak] = useState(true);
  const [nPromo,  setNPromo]  = useState(true);

  // Preferences
  const [dailyTarget,     setDailyTarget]     = useState('');
  const [answerReminder,  setAnswerReminder]  = useState('');
  const [language,        setLanguage]        = useState('');
  const [theme,           setTheme]           = useState('');

  // Privacy
  const [privLeader,    setPrivLeader]    = useState(true);
  const [privStudy,     setPrivStudy]     = useState(true);
  const [privAnalytics, setPrivAnalytics] = useState(true);

  const notify = (msg: string, ok = true) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    userService
      .getProfile()
      .then((res) => {
        const d = res.data || {};
        const s = d.settings || {};
        const notifs = s.notifications || {};
        const prefs  = s.preferences  || {};
        const priv   = s.privacy      || {};

        setFirstName(d.firstName || '');
        setLastName(d.lastName   || '');
        setEmail(d.email || user?.email || '');
        setBio(d.bio || '');

        setNMcq(notifs.mcq    ?? true);
        setNAnswer(notifs.answer ?? true);
        setNDigest(notifs.digest ?? true);
        setNStreak(notifs.streak ?? true);
        setNPromo(notifs.promo   ?? true);

        setDailyTarget(prefs.dailyTarget    || '');
        setAnswerReminder(prefs.answerReminder || '');
        setLanguage(prefs.language          || '');
        setTheme(prefs.theme                || '');

        setPrivLeader(priv.leaderboard ?? true);
        setPrivStudy(priv.studyRoom    ?? true);
        setPrivAnalytics(priv.analytics ?? true);
      })
      .catch(() => {});
  }, [user?.email]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userService.updateProfile({ firstName, lastName, bio });
      notify('Profile updated successfully.');
    } catch (e: any) {
      notify(e?.message || 'Could not save profile.', false);
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await userService.updateSettings({
        notifications: { mcq: nMcq, answer: nAnswer, digest: nDigest, streak: nStreak, promo: nPromo },
      });
      notify('Notification preferences saved.');
    } catch (e: any) {
      notify(e?.message || 'Could not save.', false);
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await userService.updateSettings({ preferences: { dailyTarget, answerReminder, language, theme } } as any);
      notify('Preferences saved.');
    } catch (e: any) {
      notify(e?.message || 'Could not save.', false);
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      await userService.updateSettings({
        privacy: { leaderboard: privLeader, studyRoom: privStudy, analytics: privAnalytics },
      });
      notify('Privacy settings saved.');
    } catch (e: any) {
      notify(e?.message || 'Could not save.', false);
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Tab views ───────── */

  const profileView = (
    <div className="rounded-[16px] border border-[#E4E7EC] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Profile Information</h2>

      <div className="grid gap-5 md:grid-cols-2 mb-5">
        <div>
          <label className={lbl}>First name</label>
          <input className={inp} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Last name</label>
          <input className={inp} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="mb-5">
        <label className={lbl}>Email</label>
        <input
          className={`${inp} cursor-not-allowed bg-[#F9FAFB] text-[#667085]`}
          value={email}
          disabled
        />
      </div>

      <div className="mb-6">
        <label className={lbl}>Bio</label>
        <textarea
          className="w-full min-h-[110px] rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-3 text-[15px] text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#162456] focus:ring-2 focus:ring-[#162456]/10 resize-none transition"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about your UPSC preparation journey…"
        />
      </div>

      <button className={primaryBtn} onClick={saveProfile} disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );

  const securityView = (
    <div className="rounded-[16px] border border-[#E4E7EC] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Security &amp; Password</h2>

      <div className="flex flex-col gap-5 max-w-[580px]">
        <div>
          <label className={lbl}>Current password</label>
          <input
            className={inp}
            type="password"
            placeholder="Enter current password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
        </div>

        <div>
          <label className={lbl}>New password</label>
          <input
            className={inp}
            type="password"
            placeholder="Min. 8 characters"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <ul className="mt-2 flex flex-col gap-0.5 pl-0 list-none">
            {['At least 8 characters', 'Contains a number', 'Contains a symbol (@ # $ !)'].map((hint) => (
              <li key={hint} className="text-[13px] text-[#667085]">{hint}</li>
            ))}
          </ul>
        </div>

        <div>
          <label className={lbl}>Confirm new password</label>
          <input
            className={inp}
            type="password"
            placeholder="Repeat new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
        </div>

        <div>
          <button className={primaryBtn}>Update password</button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="mt-8 pt-6 border-t border-[#F2F4F7]">
        <h3 className="text-[18px] font-bold text-[#101828] mb-5">Active Sessions</h3>
        <div className="flex flex-col gap-3 max-w-[580px]">
          <div className="rounded-[12px] border border-[#E4E7EC] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-[#101828]">Chrome · macOS · Delhi, IN</p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[#12B76A]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#12B76A]" />
                Current session
              </p>
            </div>
          </div>
          <div className="rounded-[12px] border border-[#E4E7EC] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-[#101828]">Safari · iPhone 15</p>
              <p className="mt-1 text-[13px] text-[#667085]">Last seen 2d ago</p>
            </div>
            <button className="h-[36px] rounded-[8px] border border-[#FECDCA] px-4 text-[14px] font-semibold text-[#D92D20] hover:bg-[#FEF3F2] transition">
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const notificationsView = (
    <div className="rounded-[16px] border border-[#E4E7EC] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Notifications</h2>

      <div className="flex flex-col">
        {[
          { label: 'Daily MCQ reminder',            desc: 'Remind to complete daily practice', on: nMcq,    toggle: () => setNMcq(v    => !v) },
          { label: 'Answer evaluation complete',     desc: 'When AI finishes evaluating',       on: nAnswer, toggle: () => setNAnswer(v => !v) },
          { label: 'Current affairs morning digest', desc: 'Daily at 8 AM',                    on: nDigest, toggle: () => setNDigest(v => !v) },
          { label: 'Streak at risk',                 desc: 'Alert before streak breaks',        on: nStreak, toggle: () => setNStreak(v => !v) },
          { label: 'Promotional emails',             desc: 'Updates and offers',                on: nPromo,  toggle: () => setNPromo(v  => !v) },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 py-4 border-b border-[#F2F4F7] last:border-0"
          >
            <div>
              <p className="text-[15px] font-semibold text-[#101828]">{item.label}</p>
              <p className="mt-0.5 text-[13px] text-[#1D4ED8]">{item.desc}</p>
            </div>
            <Toggle on={item.on} toggle={item.toggle} />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button className={primaryBtn} onClick={saveNotifications} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );

  const preferencesView = (
    <div className="rounded-[16px] border border-[#E4E7EC] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Preferences</h2>

      <div className="flex flex-col gap-5 max-w-[580px]">
        <div>
          <label className={lbl}>Daily MCQ target</label>
          <select
            className={`${inp} appearance-auto`}
            value={dailyTarget}
            onChange={(e) => setDailyTarget(e.target.value)}
          >
            <option value="">Select target</option>
            <option value="10">10 MCQs</option>
            <option value="20">20 MCQs</option>
            <option value="50">50 MCQs</option>
            <option value="75">75 MCQs</option>
            <option value="100">100 MCQs</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Answer writing reminder</label>
          <select
            className={`${inp} appearance-auto`}
            value={answerReminder}
            onChange={(e) => setAnswerReminder(e.target.value)}
          >
            <option value="">Select option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Language</label>
          <select
            className={`${inp} appearance-auto`}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">Select language</option>
            <option value="english">English</option>
            <option value="hindi">Hindi (Beta)</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Theme</label>
          <select
            className={`${inp} appearance-auto`}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <button className={primaryBtn} onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );

  const privacyView = (
    <div className="rounded-[16px] border border-[#E4E7EC] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Privacy Settings</h2>

      <div className="flex flex-col">
        {[
          { label: 'Show on leaderboard',      desc: 'Others can view your rank',     on: privLeader,    toggle: () => setPrivLeader(v    => !v) },
          { label: 'Share study room activity', desc: 'Visible to room members',       on: privStudy,     toggle: () => setPrivStudy(v     => !v) },
          { label: 'Analytics data usage',      desc: 'Help improve recommendations',  on: privAnalytics, toggle: () => setPrivAnalytics(v => !v) },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 py-4 border-b border-[#F2F4F7] last:border-0"
          >
            <div>
              <p className="text-[15px] font-semibold text-[#101828]">{item.label}</p>
              <p className="mt-0.5 text-[13px] text-[#667085]">{item.desc}</p>
            </div>
            <Toggle on={item.on} toggle={item.toggle} />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button className={primaryBtn} onClick={savePrivacy} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );

  /* ───────── Page shell ───────── */

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 flex min-w-[280px] items-start gap-3 rounded-[12px] px-5 py-4 text-white shadow-lg"
          style={{ background: toast.ok ? '#0F172B' : '#7F1D1D' }}
        >
          <span className="text-[18px]">{toast.ok ? '✓' : '!'}</span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">{toast.ok ? 'Success' : 'Error'}</div>
            <div className="text-[13px] opacity-90">{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} className="text-[18px] opacity-75 hover:opacity-100">×</button>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] text-[#667085] mb-1">
          <Link href="/dashboard" className="hover:text-[#101828] transition">Home</Link>
          <span>/</span>
          <span className="font-medium text-[#344054]">Account Settings</span>
        </nav>

        <h1 className="text-[28px] font-bold text-[#101828] mb-6">Account Settings</h1>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="rounded-[16px] border border-[#E4E7EC] bg-white p-3 h-fit" style={cardStyle}>
            <div className="flex flex-col gap-0.5">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex h-[48px] items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-semibold transition ${
                      active ? 'bg-[#F4F7FB] text-[#101828]' : 'text-[#475467] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <span className="text-[18px] leading-none">{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="my-3 border-t border-[#F2F4F7]" />

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex h-[48px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-semibold text-[#D92D20] hover:bg-[#FEF3F2] transition"
            >
              <span className="text-[18px] leading-none">🗑️</span>
              Delete Account
            </button>

            <button
              type="button"
              onClick={async () => { await logout(); }}
              className="flex h-[48px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-semibold text-[#D92D20] hover:bg-[#FEF3F2] transition"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Sign Out
            </button>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            {tab === 'profile'       && profileView}
            {tab === 'security'      && securityView}
            {tab === 'notifications' && notificationsView}
            {tab === 'preferences'   && preferencesView}
            {tab === 'privacy'       && privacyView}
          </main>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-[460px] rounded-[20px] bg-white p-6 md:p-7"
            style={{ boxShadow: '0 25px 50px rgba(15,23,42,0.25)', border: '1.5px solid #162456' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#D08700]">Account Settings</p>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="-mt-1 -mr-1 w-7 h-7 flex items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#F8FAFC]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <h3 className="text-[22px] font-bold text-[#101828] mb-4">Delete your account?</h3>

            {/* What they lose */}
            <div className="rounded-[10px] bg-[#FEF2F2] border-l-[3px] border-[#DC2626] px-4 py-3 mb-5">
              <p className="text-[13px] font-semibold text-[#B42318] mb-1.5">You will permanently lose:</p>
              <ul className="text-[13px] text-[#B42318] leading-[1.7] space-y-0.5">
                <li>✕ All your progress and scores</li>
                <li>✕ Your saved data and history</li>
                <li>✕ Your preferences and settings</li>
                <li>✕ Access to all premium features</li>
              </ul>
            </div>

            {/* Reason */}
            <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">
              What&apos;s making you leave? <span className="text-[#94A3B8] font-normal">(required)</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Share what's not working for you – every word helps us improve..."
              rows={3}
              className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[13px] text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#162456] focus:ring-2 focus:ring-[#162456]/10 transition resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-[#94A3B8]">min. 20 characters</p>

            {/* Retention options */}
            <p className="mt-4 mb-2 text-[13px] font-semibold text-[#344054]">
              Is there anything we could do to keep you?
            </p>
            <div className="flex flex-col gap-2 mb-5">
              {[
                { value: 'pause',     label: 'Pause my account for 30 days' },
                { value: 'downgrade', label: 'Downgrade to a free plan' },
                { value: 'export',    label: 'Export my data first' },
                { value: 'final',     label: "No, I've made my decision" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 rounded-[8px] border px-3 py-2 cursor-pointer transition ${
                    retentionChoice === opt.value
                      ? 'border-[#162456] bg-[#F4F7FB]'
                      : 'border-[#D0D5DD] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <input
                    type="radio"
                    name="retention"
                    value={opt.value}
                    checked={retentionChoice === opt.value}
                    onChange={(e) => setRetentionChoice(e.target.value)}
                    className="accent-[#162456]"
                  />
                  <span className="text-[13px] text-[#344054]">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                  setRetentionChoice('');
                }}
                className="flex-1 h-[42px] rounded-[8px] bg-[#101828] text-[13px] font-semibold text-white hover:bg-[#1F2937] transition"
              >
                Keep my account
              </button>
              <button
                disabled={deleteReason.trim().length < 20}
                onClick={() => {
                  setShowDeleteModal(false);
                  router.push('/dashboard/feedback');
                }}
                className="flex-1 h-[42px] rounded-[8px] bg-[#475467] text-[13px] font-semibold text-white hover:bg-[#344054] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send us feedback →
              </button>
            </div>

            {/* Footer note */}
            <div className="flex items-start gap-2 rounded-[8px] bg-[#EFF6FF] px-3 py-2.5">
              <span className="text-[#1D4ED8] text-[14px] leading-none mt-0.5">ⓘ</span>
              <p className="text-[12px] text-[#475467] leading-[1.5]">
                Your feedback is private and will help us improve the product for everyone.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
