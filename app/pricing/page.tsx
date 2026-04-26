'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pricingService } from '@/lib/services';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  features: string[];
  notIncluded: string[];
  badge?: string;
  isPopular: boolean;
}

const faqs = [
  {
    q: 'What is included in the free trial?',
    a: 'You get full access to all Pro Aspirant features for 7 days. No credit card required. Cancel anytime.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can upgrade or downgrade your plan at any time from Account Settings. Changes take effect at your next billing cycle.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes. We offer a full, no-questions-asked refund within 7 days of your initial subscription payment. See our Refund Policy for details.',
  },
  {
    q: 'How does the AI Mains Evaluator work?',
    a: 'Upload a photo of your handwritten answer or type it directly. Our AI evaluates it in 60 seconds across 8 parameters — content, structure, analysis, examples, and more — giving you UPSC examiner-level feedback.',
  },
  {
    q: 'What happens after my free trial ends?',
    a: 'Your account moves to the free Starter plan. You keep all your study data, streak history, and progress. No data is lost.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes. Annual plans come with a discount. Contact us at billing@risewithjeet.in for annual pricing.',
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    pricingService.getPlans()
      .then((res) => {
        const data = res.data || [];
        // If API returns empty, use defaults
        if (data.length === 0) {
          setPlans([
            {
              id: 'starter',
              name: 'Starter',
              price: 0,
              duration: 'Free',
              description: 'Get a taste of what RiseWithJeet offers. No credit card required.',
              features: ['10 MCQs / day', 'Current Affairs', 'Live Study Room'],
              notIncluded: ['Mock Tests', 'AI Mains Evaluator', 'Mentorship'],
              badge: '',
              isPopular: false,
            },
            {
              id: 'pro',
              name: 'Pro Aspirant',
              price: 499,
              duration: 'month',
              description: 'Everything you need for serious UPSC preparation, powered by AI.',
              features: ['Unlimited MCQs', 'AI Mains Answer Evaluation', 'Full Mock Test Suite', 'Complete Study Material Library', 'Flashcards & Spaced Repetition', 'Performance Analytics'],
              notIncluded: ['Mentorship'],
              badge: 'Most Popular',
              isPopular: true,
            },
            {
              id: 'mentor',
              name: 'Mentorship Pro',
              price: 1499,
              duration: 'month',
              description: 'Pro Aspirant + personal mentorship from UPSC experts.',
              features: ['Everything in Pro Aspirant', 'Weekly 1-on-1 Mentorship', 'Jeet Path Roadmap', 'Priority Answer Review', 'Interview Prep Module', 'Direct Mentor Access'],
              notIncluded: [],
              badge: '',
              isPopular: false,
            },
          ]);
        } else {
          setPlans(data);
        }
      })
      .catch(() => {
        setPlans([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const allFeatures = Array.from(
    new Set(plans.flatMap(p => p.features))
  );

  const getFeatureValue = (plan: Plan, feature: string) => {
    if (plan.features.includes(feature)) return '✓';
    if (plan.notIncluded?.includes(feature)) return '✗';
    // Check for similar feature names
    const hasSimilar = plan.features.some(f => 
      f.toLowerCase().includes(feature.toLowerCase().split(' ')[0])
    );
    return hasSimilar ? '✓' : '—';
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center px-6 pt-28 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#131e33] border border-[#2a3550] rounded-full px-5 py-2.5 mb-6">
          <span className="text-[#d08700] text-xs">💰</span>
          <span className="text-[#90a1b9] text-xs font-medium tracking-wide uppercase">Radically Transparent Pricing</span>
        </div>

        {/* Eyebrow */}
        <p className="text-[#d08700] text-xs tracking-[1.5px] uppercase mb-4">Fair Pricing, No Surprises</p>

        {/* Headline */}
        <h1 className="text-white text-5xl md:text-6xl leading-[1.1] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          Choose your{' '}
          <span className="text-[#d4af37]" style={{ fontStyle: 'italic' }}>plan</span>
        </h1>

        {/* Sub */}
        <p className="text-[#90a1b9] text-lg leading-[28px] max-w-2xl mb-4">
          We charge only what it takes to run and improve this platform. Not a rupee more. That promise is non-negotiable.
        </p>
        <p className="text-[#62748e] text-sm max-w-xl">
          All paid plans include a 7-day free trial. Cancel anytime. No questions asked.
        </p>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="px-6 pb-20">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-[#90a1b9]">Loading plans...</p>
            </div>
          ) : plans.map((plan, i) => (
            <div
              key={plan.id || i}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.isPopular
                  ? 'bg-[#111827] border-2 border-[#f0b100] relative'
                  : 'bg-[#111827] border border-[#1d293d]'
              }`}
            >
              {(plan.badge || plan.isPopular) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f0b100] text-[#0f172b] text-xs font-bold px-4 py-1 rounded-full">
                  {plan.badge || 'Most Popular'}
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-white text-xl font-semibold mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="mb-3">
                {plan.price === 0 ? (
                  <span className="text-white text-4xl font-bold">Free</span>
                ) : (
                  <>
                    <span className="text-white text-4xl font-bold">₹{plan.price.toLocaleString()}</span>
                    {plan.originalPrice && plan.originalPrice > plan.price && (
                      <span className="text-[#62748e] text-lg line-through ml-2">₹{plan.originalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-[#90a1b9] text-lg">/{plan.duration}</span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-[#90a1b9] text-sm leading-[22px] mb-6">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="flex flex-col gap-3 mb-6 flex-grow">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-[#cad5e2] text-sm">
                    <span className="text-[#22c55e] mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded?.map((f, j) => (
                  <li key={`not-${j}`} className="flex items-start gap-3 text-[#62748e] text-sm">
                    <span className="mt-0.5">✗</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.price === 0 ? '/dashboard' : '/dashboard/billing'}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors text-center block ${
                  plan.isPopular
                    ? 'bg-[#f0b100] text-[#0f172b] hover:bg-[#d4a000]'
                    : plan.price === 0
                    ? 'border border-[#45556c] text-white hover:border-[#62748e]'
                    : 'bg-[#f0b100] text-[#0f172b] hover:bg-[#d4a000]'
                }`}
              >
                {plan.price === 0 ? 'Get Started Free' : 'Purchase Plan →'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      {!loading && plans.length > 0 && (
        <section className="px-6 pb-20">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-white text-3xl text-center mb-10" style={{ fontFamily: 'Georgia, serif' }}>
              Compare plans
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1d293d]">
                    <th className="text-left text-[#90a1b9] font-medium py-4 pr-6">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className={`text-center font-semibold py-4 px-4 ${plan.isPopular ? 'text-[#f0b100]' : 'text-white'}`}>
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((feature, i) => (
                    <tr key={i} className="border-b border-[#1d293d]">
                      <td className="py-4 pr-6 text-[#cad5e2]">{feature}</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center py-4 px-4 text-[#cad5e2]">
                          {getFeatureValue(plan, feature)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="px-6 pb-20">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-white text-3xl text-center mb-10" style={{ fontFamily: 'Georgia, serif' }}>
            Frequently asked questions
          </h2>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-[#111827] border border-[#1d293d] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white text-sm font-medium pr-4">{faq.q}</span>
                  <span className={`text-[#d08700] text-lg transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[#90a1b9] text-sm leading-[24px]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-20">
        <div className="max-w-[700px] mx-auto rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(155.26deg, #0e182d 0%, #17223e 100%)', border: '1px solid #1d293d' }}>
          <h2 className="text-white text-3xl mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Still have questions?
          </h2>
          <p className="text-[#90a1b9] text-base leading-[26px] mb-8 max-w-lg mx-auto">
            Write to us at billing@risewithjeet.in. A real person reads every message and gets back to you.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[#f0b100] text-[#0f172b] font-semibold text-base px-8 py-3.5 rounded-[14px] hover:bg-[#d4a000] transition-colors"
          >
            Contact Us →
          </Link>
        </div>
      </section>

      {/* ── Footer Bar ── */}
      <footer className="border-t border-[#1d293d] px-6 py-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#d08700] rounded w-8 h-8 flex items-center justify-center">
              <span className="text-[#0f172b] font-serif text-sm font-bold">R</span>
            </div>
            <span className="text-white text-lg" style={{ fontFamily: 'Georgia, serif' }}>RiseWithJeet</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-[#90a1b9] hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[#90a1b9] hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="text-[#90a1b9] hover:text-white transition-colors">Contact Us</Link>
            <Link href="/blog" className="text-[#90a1b9] hover:text-white transition-colors">Blog</Link>
          </div>
          <p className="text-[#62748e] text-sm">
            © 2026 RiseWithJeet Edtech Pvt Ltd · Made with 💛 for every UPSC aspirant
          </p>
        </div>
      </footer>
    </div>
  );
}
