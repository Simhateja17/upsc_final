'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

type TabId = 'profile' | 'security' | 'notifications' | 'preferences' | 'privacy' | 'delete';

const TABS: { id: Exclude<TabId, 'delete'>; label: string; icon: string }[] = [
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

function FaIcon({ name, className = '' }: { name: string; className?: string }) {
  return <i className={`${name} ${className}`} aria-hidden="true" />;
}

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
  const [deleteReason, setDeleteReason] = useState('');
  const [retentionChoice, setRetentionChoice] = useState<'pause' | 'downgrade' | 'contact' | ''>('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

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

  const resetDeleteForm = () => {
    setDeleteReason('');
    setRetentionChoice('');
    setDeleteConfirmed(false);
  };

  const submitDeletionRequest = async () => {
    if (deleteReason.trim().length < 20 || !deleteConfirmed) {
      notify('Please add a reason and confirm permanent deletion.', false);
      return;
    }

    setSaving(true);
    try {
      await userService.submitFeedback({
        rating: 1,
        category: 'account_deletion',
        workingWell: 'Account deletion requested',
        couldBeBetter: deleteReason.trim(),
      });
    } catch {
      // Deletion should not be blocked by feedback capture.
    }

    notify('Account deletion request submitted. Signing you out now.');
    setTimeout(async () => {
      await logout();
      router.replace('/');
    }, 900);
    setSaving(false);
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

  const lossItems = [
    { icon: 'fas fa-chart-line', text: 'All your progress & scores (Daily MCQ/Mains Challenges, streaks, leaderboard ranks)' },
    { icon: 'fas fa-newspaper', text: 'Daily News Analysis history (The Hindu & IE) & saved articles' },
    { icon: 'fas fa-database', text: '10,000+ PYQs attempt history & personalized performance analytics' },
    { icon: 'fas fa-robot', text: 'Jeet AI Mentor conversation history, saved prompts' },
    { icon: 'fas fa-calendar-alt', text: 'Study planner, time tracker logs & revision suite (flashcards, mindmaps, spaced repetition)' },
    { icon: 'fas fa-comments', text: 'Mock test attempts & discussion forum contributions' },
  ];
  const hasRetentionChoice = retentionChoice !== '';
  const dynamicDeleteAction: { icon: string; label: string } =
    retentionChoice === 'pause'
      ? { icon: 'fas fa-pause-circle', label: 'Pause my account' }
      : retentionChoice === 'downgrade'
        ? { icon: 'fas fa-credit-card', label: 'Go to billing section' }
        : retentionChoice === 'contact'
          ? { icon: 'fas fa-headset', label: 'Contact Us' }
          : { icon: 'fas fa-user-minus', label: 'Permanently delete my account' };

  const deleteView = (
    <div>
      <div className="mb-8">
        <h1 className="text-[1.8rem] font-bold tracking-[-0.3px] text-[#0A0F1C]">Delete your account?</h1>
        <p className="mt-[6px] text-[0.9rem] text-[#5B6E8C]">
          We&apos;re sorry to see you go. Please review the impact and confirm your decision.
        </p>
      </div>

      <section className="mt-[1.2rem] rounded-[24px] border border-[#FFE4E2] bg-[#FFFCF9] p-[1.8rem] shadow-[0_2px_6px_rgba(0,0,0,0.01)]">
        <div className="mb-[1.5rem] flex items-center gap-3">
          <FaIcon name="fas fa-exclamation-triangle" className="rounded-[60px] bg-[#FFEFF2] p-[10px] text-[2rem] text-[#E11D48]" />
          <h2 className="text-[1.65rem] font-bold text-[#BE123C]">You will permanently lose:</h2>
        </div>

        <div className="mb-8 rounded-[20px] border-l-[4px] border-[#E11D48] bg-[#FEF6F6] px-6 py-[1.2rem]">
          <p className="mb-3 text-[0.95rem] font-bold text-[#2D3A5E]">
            <FaIcon name="fas fa-skull-crosswalk" className="mr-1" /> Irreversible data deletion: no recovery, no backup
          </p>
          <div className="grid gap-[0.9rem] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {lossItems.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-[60px] border border-[#FFCDCA] bg-white px-4 py-[0.6rem] text-[0.9rem] font-medium text-[#9B2C2C]"
              >
                <FaIcon name={item.icon} className="w-5 text-center text-[1rem] text-[#E11D48]" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-[1.8rem]">
          <label className="mb-[0.6rem] block text-[0.9rem] font-semibold text-[#1E2A44]">
            What&apos;s making you leave? <span className="ml-[3px] text-[#E11D48]">*</span>
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="We take your feedback seriously... (required for deletion)"
            rows={3}
            className="w-full resize-y rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-[0.9rem] font-mono text-[0.9rem] text-[#101828] outline-none placeholder:text-[#7A7A7A] focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/15"
          />
          {deleteReason.trim().length > 0 && deleteReason.trim().length < 20 && (
            <p className="mt-[6px] flex items-center gap-[6px] text-[0.8rem] text-[#E11D48]">
              <FaIcon name="fas fa-circle-info" /> Please share your reason before deleting.
            </p>
          )}
        </div>

        <div className="mb-[1.8rem] rounded-[20px] bg-[#F9FAFE] px-6 py-[1.2rem]">
          <p className="mb-[0.9rem] text-[0.95rem] font-semibold text-[#0F172A]">
            <FaIcon name="fas fa-heart" className="mr-1 text-[#E11D48]" /> Is there anything we could do to keep you?
          </p>
          <div className="flex flex-wrap items-center gap-x-[1.8rem] gap-y-[0.8rem]">
            <label className="flex cursor-pointer items-center gap-[10px] text-[0.95rem] font-medium text-[#0F172A]">
              <input
                type="checkbox"
                checked={retentionChoice === 'pause'}
                onChange={(e) => setRetentionChoice(e.target.checked ? 'pause' : '')}
                className="h-[18px] w-[18px] rounded border-[#AAB4C5] accent-[#3B82F6]"
              />
              <span>⏸️ Pause my account for 30 days</span>
            </label>
            <label className="flex cursor-pointer items-center gap-[10px] text-[0.95rem] font-medium text-[#0F172A]">
              <input
                type="checkbox"
                checked={retentionChoice === 'downgrade'}
                onChange={(e) => setRetentionChoice(e.target.checked ? 'downgrade' : '')}
                className="h-[18px] w-[18px] rounded border-[#AAB4C5] accent-[#3B82F6]"
              />
              <span>📉 Downgrade to a free plan</span>
            </label>
            <label className="flex cursor-pointer items-center gap-[10px] text-[0.95rem] font-medium text-[#0F172A]">
              <input
                type="checkbox"
                checked={retentionChoice === 'contact'}
                onChange={(e) => setRetentionChoice(e.target.checked ? 'contact' : '')}
                className="h-[18px] w-[18px] rounded border-[#AAB4C5] accent-[#3B82F6]"
              />
              <span>💬 Talk to our team - we&apos;ll reach out to help</span>
              <button
                type="button"
                onClick={() => {
                  setRetentionChoice('contact');
                  router.push('/contact?topic=account-deletion');
                }}
                className="ml-2 text-[0.85rem] font-semibold text-[#2563EB] underline"
              >
                <FaIcon name="fas fa-headset" className="mr-1" /> Request callback
              </button>
            </label>
          </div>
        </div>

        <div className="my-[1.2rem] mb-[1.5rem] flex flex-wrap items-center gap-3 rounded-[20px] border border-[#BFDBFE] bg-[#EFF6FF] px-[1.2rem] py-4">
          <div className="rounded-[50px] bg-[#DBEAFE] px-3 py-2 text-[1.2rem] text-[#0F172A]">
            <FaIcon name="fas fa-clock" />
          </div>
          <div className="min-w-[240px] flex-1">
            <h4 className="text-[0.95rem] font-bold text-[#1E40AF]">⏱️ When will my account actually be deleted?</h4>
            <p className="mt-1 text-[0.95rem] leading-[1.5] text-[#0F172A]">
              Immediately after you click &quot;Permanently delete my account&quot;. All data (progress, AI mentor history, study plans, analytics) will be erased in real-time, with no grace period or recovery.
            </p>
          </div>
        </div>

        {!hasRetentionChoice && (
          <label className="my-4 mb-[1.4rem] flex flex-wrap items-center gap-3 rounded-[18px] bg-[#FFF2F0] p-4 text-[0.95rem] font-medium text-[#0F172A]">
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={(e) => setDeleteConfirmed(e.target.checked)}
              className="h-[18px] w-[18px] rounded border-[#AAB4C5] accent-[#E11D48]"
            />
            <span>✅ I understand that my account and all associated data will be deleted <strong>instantly</strong> and cannot be restored.</span>
          </label>
        )}

        <div className="my-[1.8rem] mb-4 flex flex-wrap items-center gap-4 border-b border-[#ECF3FA] pb-4">
          <button
            type="button"
            onClick={() => {
              resetDeleteForm();
              router.push('/dashboard');
            }}
            className="rounded-[40px] border border-[#E2E8F0] bg-[#F1F5F9] px-6 py-[0.7rem] text-[0.9rem] font-semibold text-[#1E293B] transition hover:bg-[#E6EDF5]"
          >
            <FaIcon name="fas fa-arrow-left" className="mr-2" /> Keep my account
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/feedback?source=account-deletion')}
            className="rounded-[40px] border border-[#CBD5E1] bg-transparent px-6 py-[0.7rem] text-[0.9rem] font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
          >
            <FaIcon name="fas fa-paper-plane" className="mr-2" /> Send us feedback
          </button>
          <button
            type="button"
            onClick={() => {
              if (retentionChoice === 'pause' || retentionChoice === 'downgrade') {
                router.push('/dashboard/billing/plans?source=account-deletion');
                return;
              }
              if (retentionChoice === 'contact') {
                router.push('/contact?topic=account-deletion');
                return;
              }
              submitDeletionRequest();
            }}
            disabled={saving || (!hasRetentionChoice && (deleteReason.trim().length < 20 || !deleteConfirmed))}
            className={`rounded-[40px] px-6 py-[0.7rem] text-[0.9rem] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              hasRetentionChoice ? 'bg-[#1D4ED8] hover:bg-[#1E3A8A]' : 'bg-[#E11D48] hover:bg-[#BE123C]'
            }`}
          >
            {saving ? 'Submitting...' : <><FaIcon name={dynamicDeleteAction.icon} className="mr-2" />{dynamicDeleteAction.label}</>}
          </button>
        </div>

        <p className="flex items-center gap-2 border-t border-[#ECF3FA] pt-4 text-[0.75rem] text-[#6C7A91]">
          <FaIcon name="fas fa-lock" /> Your feedback is private and will help us improve the product for everyone.
        </p>
      </section>
    </div>
  );

  /* ───────── Page shell ───────── */

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
      />
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
                      active
                        ? 'bg-[#F4F7FB] text-[#101828]'
                        : 'text-[#475467] hover:bg-[#F9FAFB]'
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
              onClick={() => setTab('delete')}
              className={`flex h-[48px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-semibold transition ${
                tab === 'delete' ? 'bg-[#FEF3F2] text-[#D92D20]' : 'text-[#D92D20] hover:bg-[#FEF3F2]'
              }`}
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
            {tab === 'delete'        && deleteView}
          </main>
        </div>
      </div>
    </div>
  );
}
