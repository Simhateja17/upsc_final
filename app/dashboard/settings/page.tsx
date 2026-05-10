'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardService, userService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', emoji: 'PJ', tone: '#F59E0B', bg: '#FFF7ED' },
  { id: 'security', label: 'Security', emoji: 'SC', tone: '#2563EB', bg: '#EFF6FF' },
  { id: 'notifications', label: 'Notifications', emoji: 'NT', tone: '#DB2777', bg: '#FDF2F8' },
  { id: 'preferences', label: 'Preferences', emoji: 'PF', tone: '#7C3AED', bg: '#F5F3FF' },
  { id: 'privacy', label: 'Privacy', emoji: 'PV', tone: '#0F766E', bg: '#F0FDFA' },
] as const;

const TARGET_YEARS = ['2026', '2027', '2028', 'Later'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGES = ['English', 'Hindi (Beta)'];
const THEMES = ['System Default', 'Light', 'Dark'];
const MCQ_TARGETS = ['10', '20', '50', '75', '100'];
const REMINDER_OPTIONS = ['Yes', 'No'];
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
  'Puducherry',
];
const OPTIONAL_SUBJECTS = [
  'Agriculture',
  'Animal Husbandry and Veterinary Science',
  'Anthropology',
  'Botany',
  'Chemistry',
  'Civil Engineering',
  'Commerce and Accountancy',
  'Economics',
  'Electrical Engineering',
  'Geography',
  'Geology',
  'History',
  'Law',
  'Management',
  'Mathematics',
  'Mechanical Engineering',
  'Medical Science',
  'Philosophy',
  'Physics',
  'Political Science and International Relations',
  'Psychology',
  'Public Administration',
  'Sociology',
  'Statistics',
  'Zoology',
  'Literature',
];

const cardStyle = { boxShadow: '0px 1px 3px 0px rgba(15,23,42,0.08), 0px 1px 2px 0px rgba(15,23,42,0.06)' };
const inputClass =
  'w-full h-[48px] rounded-[12px] border border-[#D7DEEA] bg-white px-4 text-[15px] text-[#101828] outline-none transition focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#DBEAFE]';
const textareaClass =
  'w-full min-h-[120px] rounded-[12px] border border-[#D7DEEA] bg-white px-4 py-3 text-[15px] text-[#101828] outline-none transition resize-none focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#DBEAFE]';
const labelClass = 'font-arimo text-[14px] font-semibold text-[#344054]';
const btnPrimary =
  'inline-flex h-[46px] items-center justify-center rounded-[12px] bg-[#162456] px-5 font-arimo text-[15px] font-semibold text-white transition hover:bg-[#1D326E] disabled:cursor-not-allowed disabled:opacity-60';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-[28px] w-[48px] rounded-full transition-colors ${enabled ? 'bg-[#162456]' : 'bg-[#CBD5E1]'}`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-[23px]' : 'left-[3px]'}`}
      />
    </button>
  );
}

function StatCard({ label, value, note, tone }: { label: string; value: string; note?: string; tone: string }) {
  return (
    <div
      className="rounded-[14px] border border-[#E5E7EB] bg-white p-4"
      style={{ ...cardStyle, borderTop: `3px solid ${tone}` }}
    >
      <p className="font-arimo text-[13px] font-semibold uppercase tracking-[0.06em] text-[#667085]">{label}</p>
      <p className="mt-2 font-arimo text-[26px] font-bold leading-none text-[#101828]">{value}</p>
      {note ? <p className="mt-2 font-arimo text-[13px] text-[#667085]">{note}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof SETTINGS_TABS)[number]['id']>('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
  const [stats, setStats] = useState({
    currentRank: 'Unranked',
    streak: '0 days',
    mcqAttempted: '0',
    answerEvaluated: '0',
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [optionalSubject, setOptionalSubject] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifMcq, setNotifMcq] = useState(true);
  const [notifAnswer, setNotifAnswer] = useState(true);
  const [notifDigest, setNotifDigest] = useState(true);
  const [notifStreak, setNotifStreak] = useState(false);
  const [notifPromo, setNotifPromo] = useState(true);

  const [dailyTarget, setDailyTarget] = useState('10');
  const [answerReminder, setAnswerReminder] = useState('Yes');
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('System Default');

  const [privLeaderboard, setPrivLeaderboard] = useState(true);
  const [privStudyRoom, setPrivStudyRoom] = useState(true);
  const [privAnalytics, setPrivAnalytics] = useState(true);

  const showToast = (msg: string, kind: 'success' | 'error' = 'success') => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;

    userService
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        const settings = data.settings || {};
        const profile = settings.profile || {};
        const preferences = settings.preferences || {};
        const notifications = settings.notifications || {};
        const privacy = settings.privacy || {};

        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || user?.email || '');
        setBio(data.bio || '');
        setGender(profile.gender || '');
        setDateOfBirth(profile.dateOfBirth || '');
        setStateValue(profile.state || '');
        setTargetYear(profile.targetYear || '');
        setOptionalSubject(profile.optionalSubject || '');

        setNotifMcq(notifications.mcq ?? true);
        setNotifAnswer(notifications.answer ?? true);
        setNotifDigest(notifications.digest ?? true);
        setNotifStreak(notifications.streak ?? false);
        setNotifPromo(notifications.promo ?? true);

        setDailyTarget(preferences.dailyTarget || '10');
        setAnswerReminder(preferences.answerReminder || 'Yes');
        setLanguage(preferences.language || 'English');
        setTheme(preferences.theme || 'System Default');

        setPrivLeaderboard(privacy.leaderboard ?? true);
        setPrivStudyRoom(privacy.studyRoom ?? true);
        setPrivAnalytics(privacy.analytics ?? true);
      })
      .catch(() => {});

    dashboardService
      .getPerformance()
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        const rank = data.rank ?? null;
        const percentile = data.rankPercentile ?? null;
        const streakValue = data.streak?.currentStreak ?? 0;
        setStats({
          currentRank: rank ? `#${rank}` : percentile ? `${percentile} percentile` : 'Unranked',
          streak: `${streakValue} day${streakValue === 1 ? '' : 's'}`,
          mcqAttempted: String(data.mcq?.totalAttempts ?? 0),
          answerEvaluated: String(data.mains?.totalAttempts ?? 0),
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await Promise.all([
        userService.updateProfile({ firstName, lastName, bio }),
        userService.updateSettings({
          profile: {
            gender,
            dateOfBirth,
            state: stateValue,
            targetYear,
            optionalSubject,
          },
        } as any),
      ]);
      showToast('Profile updated successfully.');
    } catch (err: any) {
      showToast(err?.message || 'Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await userService.updateSettings({
        notifications: {
          mcq: notifMcq,
          answer: notifAnswer,
          digest: notifDigest,
          streak: notifStreak,
          promo: notifPromo,
        },
      });
      showToast('Notification preferences saved.');
    } catch (err: any) {
      showToast(err?.message || 'Could not save notifications.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await userService.updateSettings({
        preferences: { dailyTarget, answerReminder, language, theme },
      } as any);
      showToast('Preferences saved.');
    } catch (err: any) {
      showToast(err?.message || 'Could not save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      await userService.updateSettings({
        privacy: { leaderboard: privLeaderboard, studyRoom: privStudyRoom, analytics: privAnalytics },
      });
      showToast('Privacy settings saved.');
    } catch (err: any) {
      showToast(err?.message || 'Could not save privacy settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      showToast('Could not sign out right now.', 'error');
    }
  };

  const profileView = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 md:p-8" style={cardStyle}>
        <div className="mb-6">
          <h2 className="font-arimo text-[22px] font-bold text-[#101828]">Profile Information</h2>
          <p className="mt-1 font-arimo text-[14px] text-[#667085]">
            Keep your identity, target details and exam preferences updated in one place.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>First name</label>
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Last name</label>
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Email</label>
            <input className={`${inputClass} cursor-not-allowed bg-[#F8FAFC] text-[#667085]`} value={email} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              {GENDERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Date of birth</label>
            <input className={inputClass} type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>State</label>
            <select className={inputClass} value={stateValue} onChange={(e) => setStateValue(e.target.value)}>
              <option value="">Select state</option>
              {STATES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Optional subject</label>
            <select className={inputClass} value={optionalSubject} onChange={(e) => setOptionalSubject(e.target.value)}>
              <option value="">Select optional subject</option>
              {OPTIONAL_SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Target year</label>
            <select className={inputClass} value={targetYear} onChange={(e) => setTargetYear(e.target.value)}>
              <option value="">Select target year</option>
              {TARGET_YEARS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <label className={labelClass}>Bio</label>
          <textarea
            className={textareaClass}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Add a short note about your UPSC journey, strengths or study focus."
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button className={btnPrimary} onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6" style={cardStyle}>
          <h3 className="font-arimo text-[20px] font-bold text-[#101828]">My Stats</h3>
          <p className="mt-1 font-arimo text-[14px] text-[#667085]">A quick snapshot of your current momentum.</p>
          <div className="mt-5 grid gap-4">
            <StatCard label="Current Rank" value={stats.currentRank} tone="#2563EB" />
            <StatCard label="Streak" value={stats.streak} tone="#F59E0B" />
            <StatCard label="MCQ Attempted" value={stats.mcqAttempted} tone="#16A34A" />
            <StatCard label="Answer Evaluated" value={stats.answerEvaluated} note="Based on available backend data." tone="#7C3AED" />
          </div>
        </div>
      </div>
    </div>
  );

  const securityView = (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="font-arimo text-[22px] font-bold text-[#101828]">Security</h2>
      <p className="mt-1 font-arimo text-[14px] text-[#667085]">Password management is available here. Session controls stay unchanged.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Current password</label>
          <input className={inputClass} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>New password</label>
          <input className={inputClass} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </div>
      <div className="mt-5 max-w-[420px] flex flex-col gap-2">
        <label className={labelClass}>Confirm new password</label>
        <input className={inputClass} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      <div className="mt-6">
        <button className={btnPrimary}>Update password</button>
      </div>
    </div>
  );

  const notificationsView = (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="font-arimo text-[22px] font-bold text-[#101828]">Notifications</h2>
      <div className="mt-6 flex flex-col gap-5">
        {[
          { label: 'Daily MCQ reminder', desc: 'Remind me to complete the daily practice set.', enabled: notifMcq, toggle: () => setNotifMcq(!notifMcq) },
          { label: 'Answer evaluation complete', desc: 'Notify me when answer checking is done.', enabled: notifAnswer, toggle: () => setNotifAnswer(!notifAnswer) },
          { label: 'Current Affairs Morning Digest', desc: 'Daily at 8 AM', enabled: notifDigest, toggle: () => setNotifDigest(!notifDigest) },
          { label: 'Streak at risk', desc: 'Alert me before my streak breaks.', enabled: notifStreak, toggle: () => setNotifStreak(!notifStreak) },
          { label: 'Promotional emails', desc: 'Product updates and offers.', enabled: notifPromo, toggle: () => setNotifPromo(!notifPromo) },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-[14px] border border-[#EEF2F6] px-4 py-4">
            <div>
              <p className="font-arimo text-[16px] font-semibold text-[#101828]">{item.label}</p>
              <p className="mt-1 font-arimo text-[14px] text-[#667085]">{item.desc}</p>
            </div>
            <Toggle enabled={item.enabled} onChange={item.toggle} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className={btnPrimary} onClick={saveNotifications} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );

  const preferencesView = (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="font-arimo text-[22px] font-bold text-[#101828]">Preferences</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Daily MCQ target</label>
          <select className={inputClass} value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)}>
            {MCQ_TARGETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Answer writing reminder</label>
          <select className={inputClass} value={answerReminder} onChange={(e) => setAnswerReminder(e.target.value)}>
            {REMINDER_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Language</label>
          <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Theme</label>
          <select className={inputClass} value={theme} onChange={(e) => setTheme(e.target.value)}>
            {THEMES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6">
        <button className={btnPrimary} onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );

  const privacyView = (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6 md:p-8" style={cardStyle}>
      <h2 className="font-arimo text-[22px] font-bold text-[#101828]">Privacy Settings</h2>
      <div className="mt-6 flex flex-col gap-5">
        {[
          { label: 'Show on leaderboard', desc: 'Others can view your rank.', enabled: privLeaderboard, toggle: () => setPrivLeaderboard(!privLeaderboard) },
          { label: 'Share study room activity', desc: 'Visible to room members.', enabled: privStudyRoom, toggle: () => setPrivStudyRoom(!privStudyRoom) },
          { label: 'Analytics data usage', desc: 'Help improve recommendations.', enabled: privAnalytics, toggle: () => setPrivAnalytics(!privAnalytics) },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-[14px] border border-[#EEF2F6] px-4 py-4">
            <div>
              <p className="font-arimo text-[16px] font-semibold text-[#101828]">{item.label}</p>
              <p className="mt-1 font-arimo text-[14px] text-[#667085]">{item.desc}</p>
            </div>
            <Toggle enabled={item.enabled} onChange={item.toggle} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className={btnPrimary} onClick={savePrivacy} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-6 md:px-6 md:py-8">
      {toast ? (
        <div
          className="fixed right-6 top-6 z-50 flex min-w-[280px] items-start gap-3 rounded-[14px] px-5 py-4 text-white shadow-lg"
          style={{ background: toast.kind === 'success' ? '#0F172B' : '#7F1D1D' }}
        >
          <div className="text-[18px]">{toast.kind === 'success' ? '*' : '!'}</div>
          <div className="flex-1">
            <div className="font-arimo text-[14px] font-semibold">{toast.kind === 'success' ? 'Success' : 'Could not save'}</div>
            <div className="font-arimo text-[13px] opacity-90">{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} className="text-[18px] opacity-75 hover:opacity-100">
            x
          </button>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-arimo text-[14px] font-medium text-[#475467] transition hover:text-[#101828]">
            <span aria-hidden="true">&lt;</span>
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 rounded-[24px] bg-[#162456] px-6 py-7 text-white" style={cardStyle}>
          <div className="max-w-[760px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 font-arimo text-[12px] font-semibold tracking-[0.08em] text-[#F8D27A]">
              <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#F8D27A]/15 text-[11px]">+</span>
              ACCOUNT SETTINGS
            </div>
            <h1 className="font-semibold text-[34px] leading-[1.1] md:text-[42px]">Sharper controls for your UPSC workspace</h1>
            <p className="mt-3 max-w-[640px] font-arimo text-[15px] leading-[1.7] text-white/72">
              Update profile details, personalize reminders, manage privacy and keep your settings aligned with the rest of the dashboard.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 font-arimo text-[14px] text-[#667085]">
          <Link href="/dashboard" className="hover:text-[#101828]">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#344054]">Account Settings</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[18px] border border-[#E5E7EB] bg-white p-3" style={cardStyle}>
            <div className="mb-2 px-3 pt-2 font-arimo text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">Settings Menu</div>
            <div className="flex flex-col gap-1">
              {SETTINGS_TABS.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex h-[50px] items-center gap-3 rounded-[14px] px-3 text-left font-arimo text-[15px] font-semibold transition ${active ? 'bg-[#F4F7FB] text-[#101828]' : 'text-[#475467] hover:bg-[#F8FAFC]'}`}
                  >
                    <span
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: item.bg, color: item.tone }}
                    >
                      {item.emoji}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="my-3 border-t border-[#EAECF0]" />

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex h-[50px] w-full items-center gap-3 rounded-[14px] px-3 text-left font-arimo text-[15px] font-semibold text-[#B42318] transition hover:bg-[#FEF3F2]"
            >
              <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#FEF3F2] text-[12px] font-bold text-[#D92D20]">
                DA
              </span>
              Delete Account
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex h-[50px] w-full items-center gap-3 rounded-[14px] px-3 text-left font-arimo text-[15px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EEF2F6] text-[12px] font-bold text-[#344054]">
                SO
              </span>
              Sign Out
            </button>
          </aside>

          <main className="min-w-0">
            {activeTab === 'profile' ? profileView : null}
            {activeTab === 'security' ? securityView : null}
            {activeTab === 'notifications' ? notificationsView : null}
            {activeTab === 'preferences' ? preferencesView : null}
            {activeTab === 'privacy' ? privacyView : null}
          </main>
        </div>
      </div>

      {showDeleteModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-[540px] rounded-[22px] bg-white p-6 md:p-7"
            style={{ boxShadow: '0px 25px 50px rgba(15,23,42,0.28)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#FEF3F2] font-arimo text-[14px] font-bold text-[#D92D20]">
                  DA
                </div>
                <h3 className="mt-4 font-arimo text-[24px] font-bold text-[#101828]">Delete account</h3>
                <p className="mt-2 font-arimo text-[14px] leading-[1.7] text-[#667085]">
                  This removes access to your current workspace and can erase progress history. If this is a frustration issue rather than a final decision, send feedback first.
                </p>
              </div>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="font-arimo text-[20px] text-[#98A2B3] hover:text-[#101828]">
                x
              </button>
            </div>

            <div className="mt-5 rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-4">
              <p className="font-arimo text-[14px] font-semibold text-[#B42318]">Permanent action</p>
              <p className="mt-1 font-arimo text-[13px] leading-[1.6] text-[#B42318]">
                All account-linked settings, scores and saved progress may be removed once deletion is fully wired.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="h-[48px] rounded-[12px] border border-[#D0D5DD] bg-white font-arimo text-[15px] font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Keep my account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  router.push('/dashboard/feedback');
                }}
                className="h-[48px] rounded-[12px] border border-[#DBEAFE] bg-[#EFF6FF] font-arimo text-[15px] font-semibold text-[#1D4ED8] transition hover:bg-[#DBEAFE]"
              >
                Send us Feedback
              </button>
              <button
                type="button"
                className="h-[48px] rounded-[12px] bg-[#D92D20] font-arimo text-[15px] font-semibold text-white transition hover:bg-[#B42318]"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
