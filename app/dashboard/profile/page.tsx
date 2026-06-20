'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, userService } from '@/lib/services';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

function formatDisplayDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [optionalSubject, setOptionalSubject] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving] = useState(false);
  const [perfStats, setPerfStats] = useState<any>(null);
  const [dashStats, setDashStats] = useState<any>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear() - 22);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [showCalendar]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone((user as any).phone || '');
      const extra = (user as any).profile || {};
      setState(extra.state || '');
      setTargetYear(extra.targetYear || '');
      setOptionalSubject(extra.optionalSubject || '');
      setGender(extra.gender || '');
      setDateOfBirth(extra.dateOfBirth || '');
    }
  }, [user]);

  useEffect(() => {
    userService.getProfile().then((res) => {
      const d = res.data;
      if (d) {
        setFirstName(d.firstName || '');
        setLastName(d.lastName || '');
        setPhone(d.phone || '');
        setState(d.state || '');
        setTargetYear(d.targetYear || '');
        setOptionalSubject(d.optionalSubject || '');
        setGender(d.gender || '');
        setDateOfBirth(d.dateOfBirth || '');
        if (d.dateOfBirth) {
          const [y, m] = d.dateOfBirth.split('-').map(Number);
          setCalYear(y);
          setCalMonth(m - 1);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    dashboardService.getPerformance().then((res) => {
      if (res.data) setPerfStats(res.data);
    }).catch(() => {});
    dashboardService.getDashboard().then((res) => {
      if (res.data) setDashStats(res.data);
    }).catch(() => {});
  }, []);

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = `${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || 'User';

  const handleDiscard = () => {
    userService.getProfile().then((res) => {
      const d = res.data;
      if (d) {
        setFirstName(d.firstName || '');
        setLastName(d.lastName || '');
        setPhone(d.phone || '');
        setState(d.state || '');
        setTargetYear(d.targetYear || '');
        setOptionalSubject(d.optionalSubject || '');
        setGender(d.gender || '');
        setDateOfBirth(d.dateOfBirth || '');
      }
    }).catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      await userService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        state: state.trim(),
        targetYear: targetYear.trim(),
        optionalSubject: optionalSubject.trim(),
        gender: gender.trim(),
        dateOfBirth: dateOfBirth.trim(),
      });
      setToast({ kind: 'success', msg: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setToast({ kind: 'error', msg: err?.message || 'Could not save profile. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handlePhoneChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').replace(/^91/, '').slice(0, 10);
    setPhone(cleaned);
  };

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

  const handleDayClick = (day: number) => {
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDateOfBirth(iso);
    setShowCalendar(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const selectedParts = dateOfBirth ? dateOfBirth.split('-').map(Number) : null;

  const daysOnPlatform = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="h-screen bg-[#FAFBFE] px-6 py-4 relative overflow-hidden flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 rounded-[12px] px-5 py-4 flex items-start gap-3 shadow-lg"
          style={{
            background: toast.kind === 'success' ? '#0F172B' : '#7F1D1D',
            color: '#FFFFFF',
            border: `1px solid ${toast.kind === 'success' ? '#22C55E' : '#FCA5A5'}`,
            minWidth: 280,
          }}
        >
          <span style={{ fontSize: 18 }}>{toast.kind === 'success' ? '✅' : '⚠️'}</span>
          <div className="flex-1">
            <div className="font-semibold text-[14px]">{toast.kind === 'success' ? 'Success' : 'Could not save'}</div>
            <div className="text-[13px] opacity-90">{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-2">
        <Link href="/dashboard" className="font-normal text-[14px] leading-[20px] text-[#62748e] hover:text-[#314158]">
          Home
        </Link>
        <span className="text-[14px] leading-[20px] text-[#90a1b9]">›</span>
        <span className="font-medium text-[14px] leading-[20px] text-[#0f172b]">Profile</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-[26px] leading-[32px] text-[#0f172b] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
        My Profile
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left Column - Profile Form */}
        <div className="flex-1 min-w-0">
          <div
            className="bg-white rounded-[14px] pt-5 px-6 pb-5 flex flex-col gap-5"
            style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)' }}
          >
            {/* Avatar + Name Header */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-[24px] leading-[32px]"
                  style={{ background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover` : '#d08700' }}
                >
                  {!user?.avatarUrl && initials}
                </div>
                <div className="absolute left-[48px] top-[48px] w-4 h-4 bg-[#90a1b9] border-[1.6px] border-solid border-white rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-semibold text-[20px] leading-[28px] text-[#0f172b] break-words">{displayName}</h2>
                <p className="font-normal text-[14px] leading-[20px] text-[#62748e] truncate">{user?.email}</p>
                <span
                  className="inline-block mt-1 px-3 py-1 rounded-[4px] font-medium text-[12px] leading-[16px] text-[#a65f00]"
                  style={{ background: '#fef9c2' }}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Pro Aspirant'}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              {/* First name / Last name */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="font-medium text-[14px] leading-[20px] text-[#314158]">
                  Email{' '}
                  {user?.emailVerified !== false && (
                    <span className="text-[12px] leading-[16px] text-[#00a63e]">✓ Verified</span>
                  )}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-[#f8fafc] font-normal text-[16px] leading-[24px] text-[#62748e] cursor-not-allowed"
                />
              </div>

              {/* Gender / Date of Birth */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Gender */}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent appearance-auto"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">Date of Birth</label>
                  <div className="relative" ref={calRef}>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(v => !v)}
                      className="w-full h-[40px] px-4 rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-left focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent flex items-center justify-between gap-2 transition-colors hover:border-[#d08700]"
                    >
                      <span className={dateOfBirth ? 'text-[#0a0a0a]' : 'text-[#90a1b9]'}>
                        {dateOfBirth ? formatDisplayDate(dateOfBirth) : 'Select date'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#62748e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </button>

                    {showCalendar && (
                      <div
                        className="absolute z-50 mt-2 bg-white rounded-[16px] border border-[#e2e8f0] p-4 w-[296px]"
                        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)' }}
                      >
                        {/* Calendar header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={prevMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#314158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"/>
                            </svg>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px] text-[#0f172b]">{MONTHS[calMonth]}</span>
                            <select
                              value={calYear}
                              onChange={(e) => setCalYear(Number(e.target.value))}
                              className="font-semibold text-[14px] text-[#0f172b] bg-transparent border border-[#e2e8f0] rounded-[6px] px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#d08700] cursor-pointer"
                            >
                              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={nextMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#314158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </button>
                        </div>

                        {/* Weekday labels */}
                        <div className="grid grid-cols-7 mb-1">
                          {WEEKDAYS.map(d => (
                            <div key={d} className="text-center text-[11px] font-semibold text-[#90a1b9] py-1 tracking-wide">
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Day grid */}
                        <div className="grid grid-cols-7 gap-y-0.5">
                          {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`pad-${i}`} />
                          ))}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const isSelected =
                              selectedParts &&
                              selectedParts[0] === calYear &&
                              selectedParts[1] - 1 === calMonth &&
                              selectedParts[2] === day;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                className={`h-9 w-full rounded-full text-[13px] font-medium transition-all ${
                                  isSelected
                                    ? 'bg-[#d08700] text-white font-semibold shadow-sm'
                                    : 'text-[#314158] hover:bg-[#fef9c2] hover:text-[#a65f00]'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer */}
                        <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                          {dateOfBirth ? (
                            <>
                              <span className="text-[12px] font-medium text-[#45556c]">{formatDisplayDate(dateOfBirth)}</span>
                              <button
                                type="button"
                                onClick={() => { setDateOfBirth(''); setShowCalendar(false); }}
                                className="text-[12px] text-[#DC2626] hover:underline"
                              >
                                Clear
                              </button>
                            </>
                          ) : (
                            <span className="text-[12px] text-[#90a1b9]">No date selected</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone / State */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent"
                  />
                  {phone && phone.length !== 10 && (
                    <span className="text-[12px] text-[#DC2626]">Enter exactly 10 digits</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent appearance-auto"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target year / Optional subject */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">Target year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent appearance-auto"
                  >
                    <option value="">Select year</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="Later">Later</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-medium text-[14px] leading-[20px] text-[#314158]">Optional subject</label>
                  <select
                    value={optionalSubject}
                    onChange={(e) => setOptionalSubject(e.target.value)}
                    className="w-full h-[40px] px-4 py-[10px] rounded-[10px] border-[0.8px] border-[#e2e8f0] bg-white font-normal text-[16px] leading-[24px] text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#d08700] focus:border-transparent appearance-auto"
                  >
                    <option value="">Select Subject</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Animal Husbandry and Veterinary Science">Animal Husbandry and Veterinary Science</option>
                    <option value="Anthropology">Anthropology</option>
                    <option value="Botany">Botany</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Commerce and Accountancy">Commerce and Accountancy</option>
                    <option value="Economics">Economics</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Geography">Geography</option>
                    <option value="Geology">Geology</option>
                    <option value="History">History</option>
                    <option value="Law">Law</option>
                    <option value="Management">Management</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Medical Science">Medical Science</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Physics">Physics</option>
                    <option value="Political Science and International Relations">Political Science and International Relations</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Public Administration">Public Administration</option>
                    <option value="Sociology">Sociology</option>
                    <option value="Statistics">Statistics</option>
                    <option value="Zoology">Zoology</option>
                    <option value="Literature">Literature</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleDiscard}
                  className="h-[40px] px-6 rounded-[10px] border-[0.8px] border-[#cad5e2] bg-white font-medium text-[16px] leading-[24px] text-[#314158] hover:bg-[#f8fafc] transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-[44px] px-6 rounded-[10px] font-semibold text-[16px] leading-[24px] text-[#0f172b] transition-colors hover:opacity-90"
                  style={{ background: '#f0b100' }}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats + Achievements */}
        <div className="w-full lg:w-[339px] flex flex-col gap-4">
          {/* My Stats Card */}
          <div
            className="bg-white rounded-[14px] pt-4 px-5 pb-4 flex flex-col gap-4"
            style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/stats.png" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
              <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">My Stats</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-normal text-[14px] leading-[20px] text-[#45556c]">Days on platform</span>
                <span className="font-semibold text-[14px] leading-[20px] text-[#0f172b]">{daysOnPlatform} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-normal text-[14px] leading-[20px] text-[#45556c]">MCQs attempted</span>
                <span className="font-semibold text-[14px] leading-[20px] text-[#0f172b]">{perfStats?.questionsAttempted?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-normal text-[14px] leading-[20px] text-[#45556c]">Tests taken</span>
                <span className="font-semibold text-[14px] leading-[20px] text-[#0f172b]">{perfStats?.testsTaken?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-normal text-[14px] leading-[20px] text-[#45556c]">Syllabus coverage</span>
                <span className="font-semibold text-[14px] leading-[20px] text-[#0f172b]">{perfStats?.syllabusCoverage ?? 0}%</span>
              </div>
              {(() => {
                const streakDays = dashStats?.streak?.currentStreak ?? 0;
                return (
                  <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-2">
                    <span className="font-normal text-[14px] leading-[20px] text-[#45556c]">Streak</span>
                    <span className="font-semibold text-[14px] leading-[20px] text-[#d08700] flex items-center gap-1">
                      {streakDays > 0 && <span>🔥</span>}
                      {streakDays.toLocaleString()} {streakDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                );
              })()}
              <div className="flex items-center justify-between">
                <span className="font-normal text-[14px] leading-[20px] text-[#45556c]">Current rank</span>
                <span className="font-semibold text-[14px] leading-[20px] text-[#d08700]">
                  {perfStats?.rank ? `#${perfStats.rank.toLocaleString()}` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div
            className="bg-white rounded-[14px] pt-4 px-5 pb-4 flex flex-col gap-4"
            style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/trophy.png" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
                <h3 className="font-semibold text-[18px] leading-[28px] text-[#0f172b]">Achievements</h3>
              </div>
              <button
                onClick={() => setShowAllBadges((v) => !v)}
                className="font-semibold text-[12px] text-[#1E2875] hover:underline"
              >
                {showAllBadges ? '← Less' : 'All →'}
              </button>
            </div>

            {(() => {
              const streakDays = dashStats?.streak?.currentStreak ?? 0;
              const mcqs = perfStats?.questionsAttempted ?? 0;
              const tests = perfStats?.testsTaken ?? 0;
              const rankPercentile = perfStats?.rankPercentile ?? null;
              const syllabusCoverage = perfStats?.syllabusCoverage ?? 0;
              const jeetCoins = perfStats?.jeetCoins ?? 0;

              if (showAllBadges) {
                const allBadges: { title: string; note: string; icon?: string; status: 'earned' | 'in-progress' | 'locked'; accent: string; tint: string }[] = [
                  {
                    title: '30-Day Streak',
                    note: `${streakDays} day streak`,
                    icon: '/icons/dashboard/badge-streak.png',
                    accent: '#F59E0B',
                    tint: '#FFF7E8',
                    status: streakDays >= 30 ? 'earned' : streakDays > 0 ? 'in-progress' : 'locked',
                  },
                  {
                    title: 'Quick Learner',
                    note: `${tests} tests done`,
                    icon: '/icons/dashboard/badge-learner.png',
                    accent: '#F59E0B',
                    tint: '#FFF9EB',
                    status: tests >= 10 ? 'earned' : tests > 0 ? 'in-progress' : 'locked',
                  },
                  {
                    title: '95% Accuracy',
                    note: rankPercentile !== null ? `Top ${rankPercentile}%` : 'Build accuracy',
                    icon: '/icons/dashboard/badge-accuracy.png',
                    accent: '#4F7CFF',
                    tint: '#EEF4FF',
                    status: tests > 0 && (rankPercentile ?? 100) <= 5 ? 'earned' : tests > 0 ? 'in-progress' : 'locked',
                  },
                  {
                    title: 'Polity Pro',
                    note: `${syllabusCoverage}% coverage`,
                    accent: '#7C3AED',
                    tint: '#F5F3FF',
                    status: syllabusCoverage >= 60 ? 'earned' : syllabusCoverage > 0 ? 'in-progress' : 'locked',
                  },
                  {
                    title: 'All-Rounder',
                    note: 'Consistency badge',
                    accent: '#2563EB',
                    tint: '#EFF6FF',
                    status: streakDays >= 7 && tests >= 5 && syllabusCoverage >= 40 ? 'earned' : (streakDays > 0 || tests > 0 || syllabusCoverage > 0) ? 'in-progress' : 'locked',
                  },
                  {
                    title: 'Centurion',
                    note: `${jeetCoins}/100 coins`,
                    accent: '#0EA5A4',
                    tint: '#ECFEFF',
                    status: jeetCoins >= 100 ? 'earned' : jeetCoins > 0 ? 'in-progress' : 'locked',
                  },
                ];

                const statusLabel: Record<string, string> = { earned: 'Earned', 'in-progress': 'In Progress', locked: 'Locked' };
                const statusColor: Record<string, string> = { earned: '#16a34a', 'in-progress': '#d08700', locked: '#94a3b8' };

                return (
                  <div className="grid grid-cols-2 gap-3">
                    {allBadges.map((badge) => (
                      <div
                        key={badge.title}
                        className="flex flex-col items-center rounded-[10px] pt-3 pb-3 px-2"
                        style={{ background: badge.tint, opacity: badge.status === 'locked' ? 0.6 : 1 }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-1.5"
                          style={{ background: 'white', border: `1.5px solid ${badge.accent}22` }}
                        >
                          {badge.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={badge.icon} alt="" width={28} height={28} className="w-7 h-7 object-contain" />
                          ) : (
                            <span style={{ color: badge.accent, fontSize: 20 }}>★</span>
                          )}
                        </div>
                        <span className="font-medium text-[12px] leading-[16px] text-[#0f172b] text-center">{badge.title}</span>
                        <span className="text-[10px] leading-[14px] text-[#62748e] text-center">{badge.note}</span>
                        <span
                          className="mt-1 font-semibold text-[10px] leading-[14px]"
                          style={{ color: statusColor[badge.status] }}
                        >
                          {statusLabel[badge.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }

              const earned: { icon: string; label: string }[] = [];
              if (streakDays >= 3) earned.push({ icon: '/icons/fire.png', label: `${streakDays}-day streak` });
              if (mcqs >= 100) earned.push({ icon: '/icons/target.png', label: `${mcqs.toLocaleString()} MCQs` });
              if (tests >= 5) earned.push({ icon: '/icons/trophy2.png', label: `${tests} Tests` });
              if (rankPercentile && rankPercentile <= 10) {
                earned.push({ icon: '/icons/trophy2.png', label: `Top 10% rank` });
              }

              if (earned.length === 0) {
                return (
                  <div className="text-center py-4 px-2">
                    <div className="text-[28px] mb-2">🌱</div>
                    <p className="font-medium text-[14px] text-[#0f172b] mb-1">No badges yet</p>
                    <p className="text-[12px] text-[#62748e]">
                      Maintain a 3-day streak, attempt 100 MCQs, or evaluate 10 answers to earn your first badge.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-3">
                  {earned.map((achievement) => (
                    <div
                      key={achievement.label}
                      className="flex flex-col items-center bg-[#f8fafc] rounded-[10px] pt-4 pb-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={achievement.icon} alt="" width={36} height={36} className="w-9 h-9 object-contain" />
                      </div>
                      <span className="font-normal text-[12px] leading-[16px] text-[#45556c] text-center">{achievement.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
