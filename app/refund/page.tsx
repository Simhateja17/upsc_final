import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';
import CompanyPageToc from '@/components/CompanyPageToc';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy | RiseWithJeet',
  description: 'Understand the refund and cancellation policy for RiseWithJeet subscriptions.',
};

const tocItems = [
  { id: 'our-approach', num: '01', label: 'Our Approach' },
  { id: 'cancellations', num: '02', label: 'Cancellations' },
  { id: 'within-3-days', num: '03', label: 'Within 3 Days' },
  { id: 'after-3-days', num: '04', label: 'After 3 Days' },
  { id: 'how-to-request', num: '05', label: 'How to Request' },
  { id: 'contact-us', num: '06', label: 'Contact Us' },
];

const policyHeadingStyle = {
  color: '#0C1424',
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: '25.6px',
  fontStyle: 'normal',
  fontWeight: 600,
  lineHeight: '32px',
};

export default function RefundPolicyPage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="relative bg-[#090e1c] pt-32 pb-20 text-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 65%)' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.12)] px-4 py-1.5 text-xs font-medium text-[#e8b84b]">
            <span>↩️</span> Refund Policy
          </div>
          <div className="mb-3 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-400/70">
            <span className="h-px w-8 bg-amber-400/30" />
            Transparent and Fair
            <span className="h-px w-8 bg-amber-400/30" />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '60.80px', fontWeight: 600, lineHeight: '69.92px' }}>
            <span className="text-white">Refund and </span><em style={{ color: '#E8B84B', fontStyle: 'italic', fontWeight: 400 }}>Cancellation</em>
          </h1>
          <p className="mt-4" style={{ fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: '20.80px' }}>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>Effective date:</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}> February 1, 2025 &nbsp;&middot;&nbsp; </span>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>Last updated:</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}> May 1, 2026</span>
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#FAF8F4] py-16">
        <div className="mx-auto flex max-w-5xl gap-12 px-6 lg:px-8">

          <CompanyPageToc
            ariaLabel="Refund policy contents"
            items={tocItems}
            contactLabel="Billing queries"
            contactValue="together@risewithjeet.com"
            contactHref="mailto:together@risewithjeet.com"
          />

          {/* Main content */}
          <div className="min-w-0 max-w-[800px] flex-1">

            {/* Section 1: Our Approach */}
            <section id="our-approach" className="mb-14 scroll-mt-24">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.8rem', fontWeight: 700, color: '#e8b84b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>01</div>
              <h2 className="mb-6" style={policyHeadingStyle}>Our Approach</h2>

              <div className="mb-6 flex gap-3 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                <div className="text-xl">💛</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  <strong className="text-[#0c1424]">We want you to feel confident trying RiseWithJeet.</strong> If the platform is not right for you, we will do our best to make it right. This policy explains exactly how cancellations and refunds work.
                </div>
              </div>

              <p className="mb-4" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                We built RiseWithJeet with one belief: you should only pay for something that genuinely helps you prepare. We price the platform at what it costs to run, not what the market will bear. That same thinking applies to refunds. We are not in the business of trapping people into subscriptions they do not want.
              </p>
              <p className="mb-6" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                At the same time, running this platform, training AI models on UPSC-specific content, and maintaining infrastructure has real costs. This policy reflects that balance honestly.
              </p>

              {/* Guarantee card */}
              <div className="rounded-xl border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.06)] p-6">
                <div className="flex gap-4">
                  <div className="text-2xl">🛡️</div>
                  <div>
                    <div className="mb-2 text-lg font-bold text-[#0c1424]">3-Day Money-Back Guarantee</div>
                    <p className="mb-3 text-sm leading-relaxed text-[#374560]">
                      We offer a full, no-questions-asked refund within 3 days of your initial subscription payment. This applies to all paid plans: Rise Plan and Ascent Plan.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm text-[#374560]">
                      <span>To request:</span>
                      <a href="mailto:together@risewithjeet.in" className="font-medium text-[#0c1424] underline">together@risewithjeet.in</a>
                      <span>with subject line</span>
                      <code className="rounded bg-[rgba(11,22,40,0.08)] px-1.5 py-0.5 text-xs font-medium">&quot;Refund Request&quot;</code>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Cancellations */}
            <section id="cancellations" className="mb-14 scroll-mt-24">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.8rem', fontWeight: 700, color: '#e8b84b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>02</div>
              <h2 className="mb-6" style={policyHeadingStyle}>Cancellations</h2>

              <p className="mb-4" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                You can cancel your subscription at any time with no questions asked.
              </p>

              <ul className="mb-6 list-none space-y-3 pl-0">
                <li className="flex gap-2 text-base leading-relaxed text-[#374560]">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b84b]" />
                  <span><strong className="text-[#0c1424]">How to cancel:</strong> Go to Account Settings, then Billing, and select Cancel Plan. The process takes less than a minute.</span>
                </li>
                <li className="flex gap-2 text-base leading-relaxed text-[#374560]">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b84b]" />
                  <span><strong className="text-[#0c1424]">What happens after cancellation:</strong> Your access to paid features continues until the end of your current billing period. After that, your account moves to the free Aspire plan and you keep your study data and streak history.</span>
                </li>
                <li className="flex gap-2 text-base leading-relaxed text-[#374560]">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b84b]" />
                  <span><strong className="text-[#0c1424]">No cancellation fees:</strong> There is no penalty or fee for cancelling at any time.</span>
                </li>
              </ul>

              <div className="flex gap-3 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                <div className="text-xl">💡</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  If you are going through a tough period and need a break, consider pausing rather than cancelling. Write to us at <strong className="text-[#0c1424]">together@risewithjeet.com</strong> and we will see what we can do.
                </div>
              </div>
            </section>

            {/* Section 3: Within the 3-Day Window */}
            <section id="within-3-days" className="mb-14 scroll-mt-24">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.8rem', fontWeight: 700, color: '#e8b84b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>03</div>
              <h2 className="mb-6" style={policyHeadingStyle}>Within the 3-Day Window</h2>

              <p className="mb-4" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                If you request a refund within 3 days of your initial subscription payment, we will process it in full with no questions asked. This applies to both the Rise and Ascent plans.
              </p>

              <ul className="mb-6 list-none space-y-3 pl-0">
                <li className="flex gap-2 text-base leading-relaxed text-[#374560]">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b84b]" />
                  <span><strong className="text-[#0c1424]">Full refund:</strong> 100% of the amount you paid is returned to your original payment method.</span>
                </li>
                <li className="flex gap-2 text-base leading-relaxed text-[#374560]">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b84b]" />
                  <span><strong className="text-[#0c1424]">No questions asked:</strong> You do not need to provide a reason. We trust you to make that call.</span>
                </li>

                <li className="flex gap-2 text-base leading-relaxed text-[#374560]">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b84b]" />
                  <span><strong className="text-[#0c1424]">Processing time:</strong> Refunds are processed within 5 to 7 business days to your original payment method, depending on your bank or card provider.</span>
                </li>
              </ul>

              <div className="flex gap-3 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                <div className="text-xl">📌</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  The 3-day window starts from the date of your initial payment, not from when you first log in or activate features.
                </div>
              </div>
            </section>

            {/* Section 4: After the 3-Day Window */}
            <section id="after-3-days" className="mb-14 scroll-mt-24">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.8rem', fontWeight: 700, color: '#e8b84b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>04</div>
              <h2 className="mb-6" style={policyHeadingStyle}>After the 3-Day Window</h2>

              <p className="mb-6" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                After the initial 3 days, we do not offer pro-rated refunds for unused subscription time. However, we review every situation with common sense. We will evaluate refund requests case by case for the following:
              </p>

              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                {/* Eligible */}
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-[#0c1424]">
                    <span>✅</span> We will consider a refund
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-[#374560]">
                    <p>A technical issue on our end prevented you from accessing the platform and we were unable to resolve it in a reasonable time (supporting evidence required)</p>
                    <p>A duplicate or erroneous charge occurred on your account</p>
                    <p>A documented medical emergency prevented you from using the platform (documentation required)</p>
                  </div>
                </div>
                {/* Not eligible */}
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-[#0c1424]">
                    <span>❌</span> Not eligible after 3 days
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-[#374560]">
                    <p>Change of mind or a decision to pause preparation</p>
                    <p>Renewal charges on a subscription you forgot to cancel</p>
                    <p>Partial use where features were available and working</p>
                    <p>Mentorship session fees once a session has taken place</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                <div className="text-xl">📋</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  If your situation is not listed here, please write to us anyway. We look at each request individually and respond fairly.
                </div>
              </div>
            </section>

            {/* Section 5: How to Request a Refund */}
            <section id="how-to-request" className="mb-14 scroll-mt-24">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.8rem', fontWeight: 700, color: '#e8b84b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>05</div>
              <h2 className="mb-6" style={policyHeadingStyle}>How to Request a Refund</h2>

              <p className="mb-6" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                The process is simple and handled by a real person, not a bot.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#090e1c] text-sm font-bold text-[#e8b84b]">1</div>
                  <div>
                    <div className="mb-1 font-semibold text-[#0c1424]">Email us</div>
                    <p className="text-sm leading-relaxed text-[#374560]">
                      Write to <a href="mailto:together@risewithjeet.com" className="font-medium text-[#0c1424] underline">together@risewithjeet.com</a> from your registered email address. Use the subject line &quot;Refund Request&quot; and include your full name and a brief explanation of why you are requesting a refund.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#090e1c] text-sm font-bold text-[#e8b84b]">2</div>
                  <div>
                    <div className="mb-1 font-semibold text-[#0c1424]">We review and respond</div>
                    <p className="text-sm leading-relaxed text-[#374560]">
                      Our team member reviews your request. We may ask a follow-up question if needed to understand your situation better.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#090e1c] text-sm font-bold text-[#e8b84b]">3</div>
                  <div>
                    <div className="mb-1 font-semibold text-[#0c1424]">Refund processed</div>
                    <p className="text-sm leading-relaxed text-[#374560]">
                      If approved, the refund is processed back to your original payment method within 5 to 7 business days. This timeline is governed by your bank or card provider and is outside our control once we initiate it.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Contact Us */}
            <section id="contact-us" className="mb-14 scroll-mt-24">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.8rem', fontWeight: 700, color: '#e8b84b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>06</div>
              <h2 className="mb-6" style={policyHeadingStyle}>Contact Us</h2>

              <p className="mb-4" style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                For any billing or refund queries, please reach out directly. We respond as quickly as possible on working days.
              </p>

              <div className="mb-6 flex gap-3 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white p-5">
                <div className="text-xl">📬</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  Billing and refunds:{' '}
                  <a href="mailto:together@risewithjeet.com" className="font-medium text-[#172444] underline">together@risewithjeet.com</a>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: '#374560', lineHeight: 1.85, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                This policy may be updated from time to time. The &quot;Last updated&quot; date at the top of this page will reflect any changes.
              </p>
            </section>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF8F4]" style={{ padding: '72px 48px 104px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="relative overflow-hidden text-center" style={{ background: 'linear-gradient(135deg, #0b1530 0%, #0f2050 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', boxShadow: '0 40px 80px rgba(11,29,58,0.24)', maxWidth: '700px', width: '100%', padding: '69px 76px 79px' }}>
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 65%)' }} />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(26,53,96,0.5) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '50px', fontWeight: 700, color: '#fff', lineHeight: '54px', letterSpacing: '-1.2px', margin: '0 0 20px' }}>
              Need help with a<br />
              <em style={{ display: 'block', fontStyle: 'italic', color: '#E8B84B', fontWeight: 700 }}>refund or cancellation?</em>
            </h2>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '16px', fontWeight: 400, color: 'rgba(255,255,255,0.58)', maxWidth: '460px', margin: '0 auto 30px', lineHeight: '26px' }}>
              Write to us directly. Our team reads every message and gets back to you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:together@risewithjeet.com" style={{ minWidth: '286px', height: '53px', background: 'linear-gradient(144deg, #e8b84b 0%, #b8780a 100%)', color: '#0b1530', padding: '0 24px', borderRadius: '12px', fontSize: '15.5px', fontWeight: 700, border: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 14px rgba(232,184,75,0.38)' }}>
                Email: together@risewithjeet.com
              </a>
              <Link href="/contact" style={{ minWidth: '189px', height: '52px', background: 'rgba(255,255,255,0.06)', color: '#fff', padding: '0 24px', borderRadius: '12px', fontSize: '15.5px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.20)', fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
