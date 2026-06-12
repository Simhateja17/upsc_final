'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services';

const DONE_KEY = 'rwj_onboarding_complete';

// ── Responsive helper ─────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const OPTIONAL_SUBJECTS = [
  'Agriculture','Animal Husbandry and Veterinary Science','Anthropology','Botany',
  'Chemistry','Civil Engineering','Commerce and Accountancy','Economics',
  'Electrical Engineering','Geography','Geology','History','Law','Management',
  'Mathematics','Mechanical Engineering','Medical Science','Philosophy','Physics',
  'Political Science and International Relations','Psychology','Public Administration',
  'Sociology','Statistics','Zoology','Literature',
];

// ── Step 1: prep stage cards ──────────────────────────────────────────────────
const PREP_STAGES = [
  { emoji: '🌱', title: 'Just Starting Out', subtitle: 'New to UPSC, building basics', value: 'starting' },
  { emoji: '📚', title: 'Active Preparation', subtitle: 'Studying, 6–18 months in', value: 'active' },
  { emoji: '✍️', title: 'Appeared Before', subtitle: 'Wrote Prelims or Mains once+', value: 'appeared' },
  { emoji: '🎯', title: 'Serious Repeater', subtitle: 'Multiple attempts, refining strategy', value: 'repeater' },
];

// ── Step 3: reminder time cards ───────────────────────────────────────────────
const REMINDER_OPTIONS = [
  { emoji: '🌅', title: 'Early Bird', subtitle: '5:00 AM – 7:00 AM daily reminder', value: 'early-bird' },
  { emoji: '☀️', title: 'Morning', subtitle: '8:00 AM – 9:00 AM daily reminder', value: 'morning' },
  { emoji: '🌆', title: 'Evening', subtitle: '6:00 PM – 8:00 PM daily reminder', value: 'evening' },
  { emoji: '🌙', title: 'Night Owl', subtitle: '9:00 PM – 11:00 PM reminder', value: 'night-owl' },
];

interface FormData {
  targetYear: string;
  optionalSubject: string;
  state: string;
  background: string;
  hoursPerDay: string;
  biggestChallenge: string;
}

const DEFAULT_FORM: FormData = {
  targetYear: '',
  optionalSubject: '',
  state: '',
  background: '',
  hoursPerDay: '',
  biggestChallenge: '',
};

// ── Shared select/input style ─────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #E5E7EB',
  borderRadius: 10,
  padding: '11px 14px',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  color: '#111827',
  background: '#fff',
  outline: 'none',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

// ── Step progress indicator ───────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 13,
              background: i < current ? '#16A34A' : i === current ? '#D97706' : '#E5E7EB',
              color: i <= current ? '#fff' : '#9CA3AF',
              transition: 'background 0.25s',
            }}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < 3 && (
            <div style={{
              flex: 1, height: 2,
              background: i < current ? '#16A34A' : '#E5E7EB',
              transition: 'background 0.25s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Card option (step 1 & 3) ──────────────────────────────────────────────────
function OptionCard({
  emoji, title, subtitle, selected, onClick,
}: { emoji: string; title: string; subtitle: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? '#FEF3C7' : '#fff',
        border: `2px solid ${selected ? '#D97706' : '#E5E7EB'}`,
        borderRadius: 12, padding: '14px 16px', textAlign: 'left',
        cursor: 'pointer', outline: 'none', transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{emoji}</span>
      <span style={{
        display: 'block', fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700, fontSize: 14,
        color: selected ? '#D97706' : '#111827', marginBottom: 2,
      }}>{title}</span>
      <span style={{
        display: 'block', fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12, color: '#6B7280',
      }}>{subtitle}</span>
    </button>
  );
}

// ── Header (shared across all steps) ─────────────────────────────────────────
function ModalHeader({ step, firstName }: { step: number; firstName: string }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: '#FAF6E8', padding: isMobile ? '18px 18px 16px' : '24px 28px 20px' }}>
      <div style={{ marginBottom: isMobile ? 16 : 20 }}>
        <StepBar current={step} />
      </div>
      <h1 style={{
        fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700,
        fontSize: isMobile ? 19 : 22, color: '#111827', marginBottom: 6, lineHeight: 1.3,
      }}>
        Let&apos;s personalise your Aspire experience,{' '}
        <span style={{ color: '#D97706' }}>{firstName}</span>{' '}
        <span style={{ fontSize: 20 }}>👋</span>
      </h1>
      <p style={{
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
        color: '#6B7280', margin: 0,
      }}>
        This takes 60 seconds and helps us tailor your daily plan.
      </p>
    </div>
  );
}

// ── Footer buttons ────────────────────────────────────────────────────────────
function FooterButtons({
  onBack, onContinue, continueLabel = 'Continue →',
  continueDisabled = false, continueGreen = false, showBack = true, showSkip = false, onSkip,
}: {
  onBack?: () => void; onContinue: () => void; continueLabel?: string;
  continueDisabled?: boolean; continueGreen?: boolean;
  showBack?: boolean; showSkip?: boolean; onSkip?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
      <div>
        {showBack && onBack && (
          <button onClick={onBack} style={{
            background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 999,
            padding: '10px 20px', fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 500, fontSize: 14, color: '#374151', cursor: 'pointer',
          }}>
            ← Back
          </button>
        )}
        {showSkip && onSkip && !showBack && (
          <button onClick={onSkip} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13,
            color: '#9CA3AF', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
          }}>
            Skip for now
          </button>
        )}
      </div>
      <button
        onClick={onContinue}
        disabled={continueDisabled}
        style={{
          background: continueDisabled ? '#E5E7EB' : continueGreen ? '#16A34A' : '#D97706',
          color: continueDisabled ? '#9CA3AF' : '#fff',
          border: 'none', borderRadius: 999, padding: '12px 28px',
          fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 15,
          cursor: continueDisabled ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {continueLabel}
      </button>
    </div>
  );
}

// ── Step 4: dashboard preview ─────────────────────────────────────────────────
function DashboardPreview({ firstName }: { firstName: string }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12,
    }}>
      {/* dark header */}
      <div style={{ background: '#17223E', padding: '14px 16px', color: '#fff' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
          Good morning, <span style={{ color: '#D97706' }}>{firstName}!</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 8 }}>
          Welcome to your personalised command center for UPSC preparation.
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 6,
          padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: '#F59E0B', fontSize: 10 }}>▌</span>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
            UPSC CSE 2026: 26 days remaining.
          </span>
        </div>
      </div>
      {/* action bar */}
      <div style={{
        background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
        padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{
          flex: isMobile ? '1 1 100%' : 1, minWidth: 0,
          background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 8, padding: '6px 10px', color: '#9CA3AF', fontSize: 11,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          🔍 Ask Jeet AI: &quot;Explain current affairs&quot;
        </div>
        <div style={{
          background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#374151',
          whiteSpace: 'nowrap',
        }}>+ Add Task</div>
        <div style={{
          background: '#D97706', borderRadius: 8, padding: '6px 10px',
          fontSize: 11, color: '#fff', whiteSpace: 'nowrap',
        }}>⚡ Practice Test</div>
      </div>
      {/* Today's Trio */}
      <div style={{ background: '#fff', padding: '12px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#111827', marginBottom: 10 }}>
          🏆 Today&apos;s Trio
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { icon: '🎯', label: 'Daily MCQ', desc: '10 Questions · Current Affairs', btn: 'Start', btnColor: '#D97706' },
            { icon: '✍️', label: 'Mains Question', desc: 'Polity', btn: 'Attempt Now', btnColor: '#374151' },
            { icon: '📰', label: 'Daily Editorial', desc: 'Noida International Airport', btn: 'Read Now', btnColor: '#374151' },
          ].map((card) => (
            <div key={card.label} style={{
              border: '1px solid #E5E7EB', borderRadius: 8, padding: isMobile ? '8px' : '10px',
              minWidth: 0, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{card.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#111827', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 8 }}>{card.desc}</div>
              <div style={{
                marginTop: 'auto',
                background: card.btnColor, color: '#fff', borderRadius: 6,
                padding: '4px 8px', fontSize: 10, fontWeight: 500, textAlign: 'center',
              }}>{card.btn}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<'in' | 'out'>('in');

  // Step 1
  const [prepStage, setPrepStage] = useState<string | null>(null);
  // Step 2
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  // Step 3
  const [reminder, setReminder] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DONE_KEY) !== '1') {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const firstName = user?.firstName ?? 'there';

  function advance() {
    setSlideDir('out');
    setTimeout(() => {
      setStep((s) => s + 1);
      setSlideDir('in');
    }, 160);
  }

  function goBack() {
    setSlideDir('out');
    setTimeout(() => {
      setStep((s) => s - 1);
      setSlideDir('in');
    }, 160);
  }

  function finish() {
    localStorage.setItem(DONE_KEY, '1');
    localStorage.setItem('rwj_onboarding_data', JSON.stringify({ prepStage, form, reminder }));
    // Persist profile-shared fields so students don't have to re-enter them on the Profile page.
    if (form.targetYear || form.optionalSubject || form.state) {
      userService.updateProfile({
        targetYear: form.targetYear,
        optionalSubject: form.optionalSubject,
        state: form.state,
      }).catch(() => {});
    }
    setVisible(false);
  }

  const isFormValid = form.targetYear && form.background && form.hoursPerDay;

  const bodyStyle: React.CSSProperties = {
    opacity: slideDir === 'out' ? 0 : 1,
    transform: slideDir === 'out' ? 'translateX(12px)' : 'translateX(0)',
    transition: 'opacity 0.16s ease, transform 0.16s ease',
  };

  const bodyPad = isMobile ? '20px 18px 22px' : '24px 28px 28px';
  const formCols = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(10, 14, 26, 0.55)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 580,
        borderRadius: 20, overflow: 'hidden',
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.16)',
      }}>
        <ModalHeader step={step} firstName={firstName} />

        {/* ── Step 1 ── */}
        {step === 0 && (
          <div style={{ background: '#fff', padding: bodyPad, ...bodyStyle }}>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 16 }}>
              Which stage of UPSC preparation are you at?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
              {PREP_STAGES.map((o) => (
                <OptionCard key={o.value} {...o} selected={prepStage === o.value} onClick={() => setPrepStage(o.value)} />
              ))}
            </div>
            <FooterButtons
              showBack={false}
              showSkip
              onSkip={finish}
              onContinue={advance}
              continueDisabled={!prepStage}
            />
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 1 && (
          <div style={{ background: '#fff', padding: bodyPad, ...bodyStyle }}>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 20 }}>
              Tell us a bit about your prep focus
            </p>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: formCols, gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Target Exam Year</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.targetYear}
                    onChange={(e) => setForm({ ...form, targetYear: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 32 }}
                  >
                    <option value="">Select year</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="Later">Later</option>
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF', fontSize: 12 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Your Optional Subject</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.optionalSubject}
                    onChange={(e) => setForm({ ...form, optionalSubject: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 32 }}
                  >
                    <option value="">Select subject</option>
                    {OPTIONAL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF', fontSize: 12 }}>▾</span>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: formCols, gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>State</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 32 }}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF', fontSize: 12 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Your Background</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.background}
                    onChange={(e) => setForm({ ...form, background: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 32 }}
                  >
                    <option value="">Select background</option>
                    <option>College student</option>
                    <option>Working professional</option>
                    <option>Recent graduate</option>
                    <option>Homemaker</option>
                    <option>Other</option>
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF', fontSize: 12 }}>▾</span>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: formCols, gap: 16, marginBottom: 0 }}>
              <div>
                <label style={labelStyle}>How many hours do you study per day?</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.hoursPerDay}
                    onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 32 }}
                  >
                    <option value="">Select hours</option>
                    <option>1–2 hours</option>
                    <option>2–4 hours</option>
                    <option>4–6 hours</option>
                    <option>6+ hours</option>
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF', fontSize: 12 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Your biggest challenge right now</label>
                <input
                  type="text"
                  placeholder="e.g. Current Affairs retention"
                  value={form.biggestChallenge}
                  onChange={(e) => setForm({ ...form, biggestChallenge: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <FooterButtons
              onBack={goBack}
              onContinue={advance}
              continueDisabled={!isFormValid}
            />
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 2 && (
          <div style={{ background: '#fff', padding: bodyPad, ...bodyStyle }}>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 16 }}>
              Set your daily reminder time – consistency is everything
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
              {REMINDER_OPTIONS.map((o) => (
                <OptionCard key={o.value} {...o} selected={reminder === o.value} onClick={() => setReminder(o.value)} />
              ))}
            </div>
            <FooterButtons
              onBack={goBack}
              onContinue={advance}
              continueDisabled={!reminder}
            />
          </div>
        )}

        {/* ── Step 4 ── */}
        {step === 3 && (
          <div style={{ background: '#fff', padding: bodyPad, ...bodyStyle }}>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 16 }}>
              Your personalised dashboard is ready – here&apos;s a preview
            </p>
            <DashboardPreview firstName={firstName} />
            <FooterButtons
              onBack={goBack}
              onContinue={finish}
              continueLabel="Go to My Dashboard 🚀"
              continueGreen
            />
          </div>
        )}
      </div>
    </div>
  );
}
