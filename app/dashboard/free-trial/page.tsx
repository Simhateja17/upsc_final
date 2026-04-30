'use client';

import React, { useState, useEffect } from 'react';
import DashboardPageHero from '@/components/DashboardPageHero';
import { pricingService } from '@/lib/services';
import PurchaseModal from '@/components/PurchaseModal';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const heroStats = [
  { value: '15K+', label: 'COMMUNITY', color: '#F5C75D' },
  { value: '400+', label: 'MENTEES', color: '#FB7185' },
  { value: '4.9+', label: 'RATING', color: '#10B981' },
  { value: '∞', label: 'ALWAYS FREE', color: '#FFFFFF' },
];

const mentorTags = [
  { label: '✦ Solo Mentor', gold: true },
  { label: 'Strategy & Planning' },
  { label: 'Answer Writing' },
  { label: 'Prelims Optimisation' },
  { label: 'Interview Prep' },
];

const mentorStats = [
  { value: '15K+', label: 'FOLLOWERS' },
  { value: '280+', label: 'FREE PDFS' },
  { value: '3 yrs', label: 'TEACHING' },
];

const PLAN_ICONS = ['🌱', '🔥', '🏆'];
const PLAN_STYLES = [
  { tagColor: '#155DFC', tagBg: '#DBEAFE', badgeBg: '#F1F5F9', badgeColor: '#64748B', ctaStyle: 'dark' as const },
  { tagColor: '#C68A0B', tagBg: '#FEF3C7', badgeBg: '#FEF3C7', badgeColor: '#C68A0B', ctaStyle: 'gold' as const },
  { tagColor: '#8B5CF6', tagBg: '#EDE9FE', badgeBg: '#F3F4F6', badgeColor: '#64748B', ctaStyle: 'dark' as const },
];

function transformPlan(plan: any, index: number) {
  const style = PLAN_STYLES[index] ?? PLAN_STYLES[0];
  const priceNum = Number(plan.price);
  
  const planNames = ['Foundation Plan', 'Serious Attempt', 'Final Mile'];
  const planSubtitles = [
    "If your test is 12+ months away",
    "If test is 6–12 months away",
    "Interview & revision — highest intensity"
  ];
  
  const planFeatures = [
    [
      { text: '4 sessions / month', badge: 'Core', subtext: 'One per week' },
      { text: 'WhatsApp access', badge: 'Core', subtext: '48hr response' },
      { text: 'Monthly study plan', badge: 'Core', subtext: 'Tailored to you' },
      { text: 'Full resource access', badge: 'Core', subtext: 'PDFs & guides' },
      { text: 'Monthly progress review', badge: null, subtext: null },
    ],
    [
      { text: '8 sessions / month', badge: 'Core', subtext: 'Twice each week' },
      { text: 'Answer writing reviews', badge: '2x/wk', subtext: 'Detailed, fast' },
      { text: 'Mock test debriefs', badge: '2x/mo', subtext: 'After each mock' },
      { text: 'Priority WhatsApp', badge: null, subtext: '24hr max reply' },
      { text: 'Fortnightly study plans', badge: 'Core', subtext: null },
      { text: 'Full resource access', badge: 'Done', subtext: null },
    ],
    [
      { text: '12 sessions / month', badge: '3x/wk', subtext: '3 per week' },
      { text: 'Unlimited answer reviews', badge: '24-48h', subtext: 'Fast' },
      { text: 'Mock interview sessions', badge: '2x/mo', subtext: 'Tailored' },
      { text: 'DAF analysis', badge: null, subtext: '+ topic cards' },
      { text: '24/7 WhatsApp access', badge: 'Instant', subtext: null },
      { text: 'Confidence coaching', badge: 'Daily', subtext: 'Mental' },
    ],
  ];
  
  const planTags = [
    ['All materials', 'Flexible Pace', 'No Coaching'],
    ['Answer + Mocks', 'Answer Writing', 'Mock Feedback'],
    ['DAF Analysis', 'Mock Interview', '24/7 Access'],
  ];
  
  const ctas = [
    `Get Started → ₹${priceNum.toLocaleString('en-IN')}/mo →`,
    `Enrol Now → ₹${priceNum.toLocaleString('en-IN')}/mo →`,
    `Enrol Now → ₹${priceNum.toLocaleString('en-IN')}/mo →`,
  ];
  
  const bottomNotes = [
    null,
    'Limited to 8 slots @ June batch',
    'Spots close in free-call queue',
  ];
  
  return {
    name: planNames[index] ?? plan.name,
    icon: PLAN_ICONS[index] ?? '✨',
    subtitle: planSubtitles[index] ?? plan.duration,
    price: `₹${priceNum.toLocaleString('en-IN')}`,
    period: '/per month',
    tagColor: plan.isPopular ? '#C68A0B' : style.tagColor,
    tagBg: plan.isPopular ? '#FEF3C7' : style.tagBg,
    badgeBg: style.badgeBg,
    badgeColor: style.badgeColor,
    tags: planTags[index] ?? [],
    features: planFeatures[index] ?? [],
    cta: ctas[index] ?? `Get Started → ₹${priceNum.toLocaleString('en-IN')}/mo →`,
    ctaStyle: plan.isPopular ? 'gold' as const : style.ctaStyle,
    highlight: plan.isPopular ?? false,
    bottomNote: bottomNotes[index] ?? null,
  };
}

const whyFeatures = [
  {
    icon: '🎯',
    title: 'A Real Roadmap',
    description: 'A specific, tailored plan built on your stage, background, and timeline — not generic advice.',
  },
  {
    icon: '✍️',
    title: 'Answer Writing That Improves',
    description: "Jeet Sir's actual line-by-line reviews — not AI-generated nonsense. Real feedback, real improvement.",
  },
  {
    icon: '🎤',
    title: 'Interview Stage Support',
    description: 'DAF analysis, mock interviews, and confidence coaching — the stage most aspirants ignore.',
  },
  {
    icon: '💬',
    title: 'No Question Too Small',
    description: 'WhatsApp access means doubts don\'t pile up. A quick answer, prevents a derailed day.',
  },
  {
    icon: '📊',
    title: 'Accountability That Works',
    description: 'Weekly check-ins and honest review. Knowing someone is watching makes you show up.',
  },
  {
    icon: '🧠',
    title: 'Someone Spots Your Gaps',
    description: 'The biggest UPSC mistakes are invisible to the aspirant. Jeet Sir sees them — and fixes them.',
  },
];

const TESTIMONIAL_COLORS = ['#16A34A', '#EA580C', '#2563EB'];

function transformTestimonial(t: any, index: number) {
  const initials = t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return {
    initials,
    name: t.name,
    credential: t.title,
    quote: t.content,
    color: TESTIMONIAL_COLORS[index % TESTIMONIAL_COLORS.length],
  };
}

const faqItems = [
  {
    question: 'How is this different from just watching Jeet Sir on YouTube?',
    answer: 'YouTube gives you the "what" — mentorship gives you the "how, when, and why for YOU." In 1-on-1 sessions, we analyze your specific weak areas, build a personalized roadmap around your schedule, and adjust it every week based on your progress. YouTube is a broadcast; mentorship is a conversation.',
  },
  {
    question: '₹12,999 is a lot. How do I know it\'s worth it?',
    answer: 'Most aspirants spend ₹1–2 lakh on coaching that treats everyone the same. Here, every rupee goes toward strategy built for your stage — whether you\'re 6 months or 18 months from the exam. Plus, the free discovery call lets you experience the approach before committing a single rupee.',
  },
  {
    question: 'What if I don\'t clear even with mentorship?',
    answer: 'No one can guarantee a rank — and anyone who does is lying. What mentorship guarantees is that you\'ll prepare smarter, waste less time, and give your best attempt. Many of our mentees say the biggest value was clarity and confidence, even beyond the result.',
  },
  {
    question: 'I\'m a working professional with 2–3 hours a day. Is this realistic for me?',
    answer: 'Absolutely — in fact, that\'s where mentorship shines most. We\'ll build a plan that fits your 2–3 hour window, prioritize high-yield topics, and cut the noise so you\'re studying what actually matters for your target year. Several of our working-professional mentees have cleared Prelims on their first attempt.',
  },
  {
    question: 'Is the free discovery call actually free with no catch?',
    answer: 'Yes, 100%. It\'s a 20-minute call where we understand your background, your target, and your current preparation. You\'ll walk away with a rough strategy outline whether you join or not. There\'s no hard sell — if it\'s not a fit, we\'ll tell you honestly.',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FreeTrialPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [apiPlans, setApiPlans] = useState<any[] | null>(null);
  const [apiTestimonials, setApiTestimonials] = useState<any[] | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  /* ---- Dynamic seats left ---- */
  const [seatsLeft, setSeatsLeft] = useState(4);
  useEffect(() => {
    // Simulate slowly decreasing seats; in production this should come from API
    const stored = localStorage.getItem('mentorshipSeatsLeft');
    const storedTime = localStorage.getItem('mentorshipSeatsTime');
    const now = Date.now();
    if (stored && storedTime) {
      const elapsed = now - parseInt(storedTime, 10);
      const hoursPassed = Math.floor(elapsed / (1000 * 60 * 60));
      const decrease = Math.min(hoursPassed, 4); // decrease by up to 4 over time
      const base = Math.max(1, parseInt(stored, 10) - decrease);
      setSeatsLeft(base);
    } else {
      const initial = 4;
      localStorage.setItem('mentorshipSeatsLeft', String(initial));
      localStorage.setItem('mentorshipSeatsTime', String(now));
      setSeatsLeft(initial);
    }
  }, []);
  useEffect(() => {
    pricingService.getPlans()
      .then((res: any) => {
        const plans = res?.data ?? [];
        setApiPlans(Array.isArray(plans) ? plans : []);
      })
      .catch(() => setApiPlans([]));

    pricingService.getTestimonials()
      .then((res: any) => {
        const items = res?.data ?? [];
        setApiTestimonials(Array.isArray(items) ? items : []);
      })
      .catch(() => setApiTestimonials([]));
  }, []);

  const handleBookCall = async () => {
    if (!bookingName.trim() || !bookingEmail.trim()) {
      setBookingError('Please provide your name and email.');
      return;
    }
    setBookingSubmitting(true);
    setBookingError('');
    try {
      await pricingService.bookCall({
        name: bookingName.trim(),
        email: bookingEmail.trim(),
        phone: bookingPhone.trim() || undefined,
        message: bookingMessage.trim() || undefined,
      });
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const displayPlans = (apiPlans ?? []).map(transformPlan);
  const displayTestimonials = (apiTestimonials ?? []).map(transformTestimonial);

  const [purchaseModal, setPurchaseModal] = useState<{
    open: boolean;
    plan: any;
  }>({ open: false, plan: null });

  const openPurchasePlan = (name: string, price: string) => {
    setPurchaseModal({
      open: true,
      plan: { name, price },
    });
  };

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* ================================================================ */}
      {/* ================================================================ */}
      {/*  SECTION 1: HERO                                                  */}
      {/* ================================================================ */}
      <DashboardPageHero
        badgeIcon={<img src="/cap.png" alt="cap" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
        badgeText="PERSONALIZED MENTORSHIP"
        title={
          <>
            The guidance that turns{' '}
            <em className="not-italic" style={{ color: '#e8a820', fontStyle: 'italic' }}>aspirants</em>
            <br />
            into officers
          </>
        }
        subtitle="1-on-1 sessions tailored to your stage and timeline. Mentored by Abhijeet Sir."
        stats={[
          { value: '200+', label: 'Mentees', color: '#FDC700' },
          { value: '94%',  label: 'Success Rate', color: '#F87171' },
          { value: '15',   label: 'Selections', color: '#4ADE80' },
          { value: '5+',   label: 'Yrs Exp', color: '#FFFFFF' },
        ]}
      />

      {/*  SECTION 2: MENTOR CARD                                           */}
      {/* ================================================================ */}
      <section style={{ maxWidth: '1000px', margin: '24px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ background: '#0A1128', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'linear-gradient(135deg, #FDC700 0%, #FF8A00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A1128', fontWeight: 700, fontSize: '22px', flexShrink: 0 }}>J</div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '6px' }}>Abhijeet Sir</div>
                  <div style={{ fontSize: '13px', color: '#97A6BE', lineHeight: 1.5, maxWidth: '460px' }}>UPSC educator &amp; full-time mentor. 15K+ follow his free YouTube content, a select few get direct, personalized guidance.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mentorTags.map((tag) => (
                  <span key={tag.label} style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, border: tag.gold ? '1px solid rgba(245,199,93,0.3)' : '1px solid rgba(255,255,255,0.1)', color: tag.gold ? '#F5C75D' : '#9AA8BE', background: tag.gold ? 'rgba(245,199,93,0.1)' : 'rgba(255,255,255,0.04)' }}>{tag.label}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              {mentorStats.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />}
                  <div style={{ minWidth: '100px', padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#F5C75D', lineHeight: 1.1 }}>{stat.value}</div>
                    <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 600, color: '#7E8DA8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{stat.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: '12px', color: '#B5C0D2', fontWeight: 500 }}>Accepting mentees · Limited seats for June 2025 batch</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: '#F5C75D', background: 'rgba(245,199,93,0.1)', border: '1px solid rgba(245,199,93,0.2)' }}>✦ Only {seatsLeft} seats left</span>
              <span style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: '#9AA8BE', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>Next batch: June 1</span>
              <span style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: '#9AA8BE', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>Sat &amp; Sun sessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 3: PRICING                                               */}
      {/* ================================================================ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#C68A0B', textTransform: 'uppercase', marginBottom: '12px' }}>💡 CHOOSE YOUR PLAN</div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#0F172B', marginBottom: '12px' }}>One program. Your entire journey.</h2>
          <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>Pick the plan that matches your stage — or book a free call and let Abhijeet Sir recommend the right fit.</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Foundation Plan */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '28px', display: 'flex', flexDirection: 'column', flex: '1 1 300px', maxWidth: '360px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🌱</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172B' }}>Foundation Plan</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>If your test is 12+ months away</div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#0F172B' }}>₹4,999</span>
              <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500, marginLeft: '4px' }}>/per month</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#155DFC', background: '#DBEAFE' }}>All materials</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#155DFC', background: '#DBEAFE' }}>Flexible Pace</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#155DFC', background: '#DBEAFE' }}>No Coaching</span>
            </div>
            <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '20px' }} />
            <div style={{ flex: 1, marginBottom: '24px' }}>
              {[
                { text: '4 sessions / month', badge: 'Core', subtext: 'One per week' },
                { text: 'WhatsApp access', badge: 'Core', subtext: '48hr response' },
                { text: 'Monthly study plan', badge: 'Core', subtext: 'Tailored to you' },
                { text: 'Full resource access', badge: 'Core', subtext: 'PDFs & guides' },
                { text: 'Monthly progress review', badge: null, subtext: null },
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ color: '#CBD5E1', fontWeight: 700, flexShrink: 0, fontSize: '14px', marginTop: '1px' }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>{feat.text}</span>
                      {feat.badge && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#64748B', background: '#F1F5F9' }}>{feat.badge}</span>}
                    </div>
                    {feat.subtext && <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>{feat.subtext}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => openPurchasePlan('Foundation Plan', '₹4,999')} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#0F172B', color: '#FFFFFF' }}>Get Started → ₹4,999/mo →</button>
          </div>

          {/* Serious Attempt */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '2px solid #FDC700', padding: '28px', display: 'flex', flexDirection: 'column', flex: '1 1 300px', maxWidth: '360px', boxShadow: '0 4px 24px rgba(253,199,0,0.12)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172B' }}>Serious Attempt</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>If test is 6–12 months away</div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#0F172B' }}>₹8,999</span>
              <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500, marginLeft: '4px' }}>/per month</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#C68A0B', background: '#FEF3C7' }}>Answer + Mocks</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#C68A0B', background: '#FEF3C7' }}>Answer Writing</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#C68A0B', background: '#FEF3C7' }}>Mock Feedback</span>
            </div>
            <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '20px' }} />
            <div style={{ flex: 1, marginBottom: '24px' }}>
              {[
                { text: '8 sessions / month', badge: 'Core', subtext: 'Twice each week' },
                { text: 'Answer writing reviews', badge: '2x/wk', subtext: 'Detailed, fast' },
                { text: 'Mock test debriefs', badge: '2x/mo', subtext: 'After each mock' },
                { text: 'Priority WhatsApp', badge: null, subtext: '24hr max reply' },
                { text: 'Fortnightly study plans', badge: 'Core', subtext: null },
                { text: 'Full resource access', badge: 'Done', subtext: null },
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ color: '#F5C75D', fontWeight: 700, flexShrink: 0, fontSize: '14px', marginTop: '1px' }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>{feat.text}</span>
                      {feat.badge && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#C68A0B', background: '#FEF3C7' }}>{feat.badge}</span>}
                    </div>
                    {feat.subtext && <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>{feat.subtext}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => openPurchasePlan('Serious Attempt', '₹8,999')} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #FDC700 0%, #EAB308 100%)', color: '#070F24' }}>Enrol Now → ₹8,999/mo →</button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#C68A0B', marginTop: '10px', fontWeight: 500 }}>Limited to 8 slots @ June batch</div>
          </div>

          {/* Final Mile */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '28px', display: 'flex', flexDirection: 'column', flex: '1 1 300px', maxWidth: '360px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172B' }}>Final Mile</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>Interview & revision - highest intensity</div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#0F172B' }}>₹14,999</span>
              <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500, marginLeft: '4px' }}>/per month</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#8B5CF6', background: '#EDE9FE' }}>DAF Analysis</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#8B5CF6', background: '#EDE9FE' }}>Mock Interview</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#8B5CF6', background: '#EDE9FE' }}>24/7 Access</span>
            </div>
            <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '20px' }} />
            <div style={{ flex: 1, marginBottom: '24px' }}>
              {[
                { text: '12 sessions / month', badge: '3x/wk', subtext: '3 per week' },
                { text: 'Unlimited answer reviews', badge: '24-48h', subtext: 'Fast' },
                { text: 'Mock interview sessions', badge: '2x/mo', subtext: 'Tailored' },
                { text: 'DAF analysis', badge: null, subtext: '+ topic cards' },
                { text: '24/7 WhatsApp access', badge: 'Instant', subtext: null },
                { text: 'Confidence coaching', badge: 'Daily', subtext: 'Mental' },
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ color: '#CBD5E1', fontWeight: 700, flexShrink: 0, fontSize: '14px', marginTop: '1px' }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>{feat.text}</span>
                      {feat.badge && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#64748B', background: '#F1F5F9' }}>{feat.badge}</span>}
                    </div>
                    {feat.subtext && <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>{feat.subtext}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => openPurchasePlan('Final Mile', '₹14,999')} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#0F172B', color: '#FFFFFF' }}>Enrol Now → ₹14,999/mo →</button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#8B5CF6', marginTop: '10px', fontWeight: 500 }}>Spots close in free-call queue</div>
          </div>
        </div>

        {/* Still deciding */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>Still deciding?</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#0F172B', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Compare All Plans →</button>
            <button onClick={() => { setBookingSuccess(false); setBookingError(''); setShowBookingModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#0F172B', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '10px', fontWeight: 700 }}>P</div>
              Free Discovery Call
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 4: WHY MENTORSHIP WORKS                                  */}
      {/* ================================================================ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ background: '#0A1128', borderRadius: '20px', padding: '36px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#F5C75D', textTransform: 'uppercase', marginBottom: '12px' }}>★ WHY MENTORSHIP WORKS</div>
            <h2 style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '12px' }}>A coach who knows you<br />beats a <span style={{ color: '#F5C75D' }}>course that doesn't.</span></h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '440px' }}>UPSC prep is personal. Abhijeet Sir mentorship is built around you, not a batch schedule.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(48px, 5vw, 64px)', fontWeight: 700, color: '#F5C75D', lineHeight: 1 }}>1-on-1</div>
            <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, marginTop: '8px' }}>Utterly personal.<br />Never generic.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {whyFeatures.map((feat) => (
            <div key={feat.title} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{feat.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172B', marginBottom: '8px' }}>{feat.title}</div>
              <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>{feat.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 5: TESTIMONIALS                                          */}
      {/* ================================================================ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700, color: '#0F172B', marginBottom: '8px' }}>What UPSC Aspirants Say</h2>
          <p style={{ fontSize: '14px', color: '#64748B' }}>From Jeet Sir's Mentees</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Hardcoded testimonials matching Figma */}
          {[
            {
              initials: 'PR',
              name: 'Priya Rajan',
              credential: 'UPSC Prelims 2024 Cleared · Delhi · Foundation',
              quote: "I was stuck for 2 years going in circles. One month with Jeet Sir made me study with a plan that actually made sense for my situation. Cleared Prelims 2024.",
              color: '#16A34A',
            },
            {
              initials: 'AK',
              name: 'Ankit Kumar',
              credential: 'UPSC Mains 2024 · Bihar · Serious Attempt Plan',
              quote: "The answer writing feedback was the game-changer. My GS-II score jumped significantly. Jeet Sir marks exactly where you're losing marks — not vaguely.",
              color: '#EA580C',
            },
            {
              initials: 'SM',
              name: 'Sneha Mishra',
              credential: 'UPSC Interview Stage 2024 · MP · Final Mile Plan',
              quote: "The mock interview sessions gave me confidence I didn't have. Jeet Sir's DAF analysis was so thorough — half the board questions I'd already answered in our mocks.",
              color: '#2563EB',
            },
          ].map((t, idx) => (
            <div key={idx} style={{ background: '#FEFCE8', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '16px', marginBottom: '14px', color: '#FDC700', letterSpacing: '2px' }}>{'★'.repeat(5)}</div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '20px', minHeight: '80px' }}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172B' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>{t.credential}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 6: CTA BANNER                                            */}
      {/* ================================================================ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ background: 'linear-gradient(90deg, #FDC700 0%, #FF8904 100%)', borderRadius: '20px', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '60px', bottom: '-60px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
          <div style={{ flex: '1 1 400px', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: '#0F172B', lineHeight: 1.3, marginBottom: '12px' }}>Limited seats. Real results.<br />Start with a free call.</h2>
            <p style={{ fontSize: '14px', color: '#1C1C1C', lineHeight: 1.6, marginBottom: '20px', maxWidth: '400px' }}>Book a free 15-minute discovery call with Jeet Sir — no pressure, no sales pitch. Just an honest conversation about your prep and what you actually need.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => { setBookingSuccess(false); setBookingError(''); setShowBookingModal(true); }} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#0F172B', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>📞 Book Free Discovery Call</button>
              <a href="https://www.youtube.com/@RiseWithJeet" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', borderRadius: '10px', border: '2px solid #DC2626', background: '#DC2626', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span style={{ display: 'inline-flex', width: '20px', height: '14px', borderRadius: '4px', background: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid #DC2626', marginLeft: '2px' }} />
                </span>
                Watch on YouTube First
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 7: FAQ                                                   */}
      {/* ================================================================ */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>BEFORE YOU DECIDE</div>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: '#0F172B', marginBottom: '8px' }}>The questions you're actually thinking</h2>
          <p style={{ fontSize: '14px', color: '#64748B' }}>No marketing fluff — just direct answers to the real objections.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faqItems.map((faq, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172B' }}>{faq.question}</span>
                <span style={{ fontSize: '18px', color: '#94A3B8', transition: 'transform 0.2s', transform: expandedFaq === idx ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              {expandedFaq === idx && (
                <div style={{ padding: '0 20px 18px', fontSize: '14px', color: '#64748B', lineHeight: 1.7 }}>{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  BOOKING MODAL                                                    */}
      {/* ================================================================ */}
      {showBookingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', maxWidth: '440px', width: '100%', position: 'relative' }}>
            <button onClick={() => setShowBookingModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172B', marginBottom: '8px' }}>Call Booked!</h3>
                <p style={{ fontSize: '14px', color: '#64748B' }}>We'll reach out shortly to confirm your discovery call.</p>
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: 'clamp(20px, 1.6vw, 24px)',
                    fontWeight: 700,
                    color: '#101828',
                    marginBottom: '4px',
                  }}
                  className="font-arimo"
                >
                  🤙 Book Your Free Discovery Call
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6A7282',
                    marginBottom: 'clamp(20px, 2vw, 28px)',
                    lineHeight: 1.5,
                  }}
                  className="font-arimo"
                >
                  20-minute call with Jeet Sir — no commitment, no hard sell.
                </p>

                {/* Name */}
                <label
                  style={{ display: 'block', marginBottom: '14px' }}
                  className="font-arimo"
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </span>
                  <input
                    type="text"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="e.g. Priya Rajan"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      fontSize: '14px',
                      color: '#101828',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                {/* Email */}
                <label
                  style={{ display: 'block', marginBottom: '14px' }}
                  className="font-arimo"
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </span>
                  <input
                    type="email"
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="e.g. priya@gmail.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      fontSize: '14px',
                      color: '#101828',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                {/* Phone (optional) */}
                <label
                  style={{ display: 'block', marginBottom: '14px' }}
                  className="font-arimo"
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Phone <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
                  </span>
                  <input
                    type="tel"
                    value={bookingPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setBookingPhone(val);
                    }}
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      fontSize: '14px',
                      color: '#101828',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                {/* Message (optional) */}
                <label
                  style={{ display: 'block', marginBottom: '20px' }}
                  className="font-arimo"
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Message <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
                  </span>
                  <textarea
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Any specific questions or your current preparation stage..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      fontSize: '14px',
                      color: '#101828',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                {/* Error message */}
                {bookingError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: '#DC2626',
                      marginBottom: '16px',
                    }}
                    className="font-arimo"
                  >
                    {bookingError}
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleBookCall}
                  disabled={bookingSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: bookingSubmitting ? '#9CA3AF' : '#101828',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: bookingSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  className="font-arimo"
                >
                  {bookingSubmitting ? 'Booking...' : 'Book Free Call'}
                </button>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#9CA3AF',
                    marginTop: '12px',
                  }}
                  className="font-arimo"
                >
                  100% free · No commitment · We&apos;ll confirm via email
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <PurchaseModal
        open={purchaseModal.open}
        onClose={() => setPurchaseModal({ open: false, plan: null })}
        itemType="plan"
        itemId={purchaseModal.plan?.name || ''}
        itemName={purchaseModal.plan?.name || ''}
        amount={Number(purchaseModal.plan?.price?.replace?.(/[^0-9]/g, '')) || 0}
      />
    </div>
  );
}
