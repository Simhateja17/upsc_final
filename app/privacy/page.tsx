import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';
import CompanyPageToc from '@/components/CompanyPageToc';

export const metadata: Metadata = {
  title: 'Privacy Policy | RiseWithJeet',
  description:
    'Learn how RiseWithJeet collects, uses, and protects your personal information.',
};

/* ------------------------------------------------------------------ */
/*  Reusable small components scoped to this page                     */
/* ------------------------------------------------------------------ */

function SectionHeading({
  num,
  title,
  id,
}: {
  num: string;
  title: string;
  id: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <p
        className="uppercase"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#e8b84b',
          letterSpacing: '0.08em',
          marginBottom: '7px',
        }}
      >
        {num}
      </p>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.6rem',
          fontWeight: 600,
          color: '#0c1424',
          lineHeight: 1.25,
          marginBottom: '14px',
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function InfoBox({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#e8b84b]/30 bg-[#e8b84b]/5 px-5 py-4 my-5">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="text-sm leading-relaxed text-[#374560]">{children}</div>
    </div>
  );
}

function NoteBox({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="my-5 flex gap-3 rounded-[7px] border-l-2 border-l-[#E8B84B] bg-white px-5 py-4">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="text-sm leading-relaxed text-[#374560]">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function PrivacyPolicyPage() {
  const tocItems = [
    { id: 's1', num: '01', label: 'Overview' },
    { id: 's2', num: '02', label: 'What We Collect' },
    { id: 's3', num: '03', label: 'How We Use It' },
    { id: 's4', num: '04', label: 'Sharing Your Data' },
    { id: 's5', num: '05', label: 'Security' },
    { id: 's6', num: '06', label: 'Your Rights' },
    { id: 's7', num: '07', label: 'Cookies' },
    { id: 's8', num: '08', label: 'Children' },
    { id: 's9', num: '09', label: 'Changes' },
    { id: 's10', num: '10', label: 'Contact Us' },
  ];

  const pStyle = 'text-[15px] leading-[1.75] text-[#374560] mb-4';
  const liStyle = 'text-[15px] leading-[1.75] text-[#374560]';
  const sectionGap = 'mb-14';

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
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e8b84b]/30 bg-[#e8b84b]/10 px-4 py-1.5 text-xs font-medium text-[#e8b84b] mb-4">
            <span>🔏</span> Privacy Policy
          </div>
          <div className="mb-3 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-400/70">
            <span className="h-px w-8 bg-amber-400/30" />
            Private, Secure &amp; Transparent
            <span className="h-px w-8 bg-amber-400/30" />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '60.80px', fontWeight: 600, lineHeight: '69.92px', color: '#fff' }}>
            Privacy <em style={{ color: '#E8B84B', fontStyle: 'italic', fontWeight: 400 }}>Policy</em>
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
      <section
        className="bg-[#FAF8F4] py-16 md:py-24"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="mx-auto max-w-5xl px-6 lg:px-8" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '56px', alignItems: 'start' }}>
          <CompanyPageToc
            ariaLabel="Privacy policy contents"
            items={tocItems}
            contactLabel="Privacy queries"
            contactValue="together@risewithjeet.com"
            contactHref="mailto:together@risewithjeet.com"
          />

          {/* Main content */}
          <div className="min-w-0 max-w-[800px]">
            {/* 01 – Overview */}
            <div className={sectionGap}>
              <SectionHeading num="01" title="Overview" id="s1" />
              <InfoBox icon="💡">
                <strong>Short version:</strong> We collect only what we need to make
                RiseWithJeet work well for you. We never sell your data.
              </InfoBox>
              <p className={pStyle}>
                Jeetpath Academy Pvt. Ltd. (&ldquo;RiseWithJeet&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates
                the RiseWithJeet platform available at risewithjeet.in and through our
                mobile applications. This Privacy Policy explains what personal data
                we collect, why we collect it, how we use it, and the rights you have
                over it.
              </p>
              <p className={pStyle}>
                We take your privacy seriously and have written this policy in plain
                language. If anything is unclear, write to us at{' '}
                <a
                  href="mailto:together@risewithjeet.com"
                  className="underline underline-offset-2 hover:text-[#0c1424]"
                >
                  together@risewithjeet.com
                </a>{' '}
                and we will explain it.
              </p>
              <p className={pStyle}>
                By using the platform, you agree to the practices described here.
              </p>
            </div>

            {/* 02 – What We Collect */}
            <div className={sectionGap}>
              <SectionHeading num="02" title="What We Collect" id="s2" />
              <p className={pStyle}>
                We collect information you give us directly, and information that is
                generated when you use the platform.
              </p>

              <div className="overflow-x-auto my-5 rounded-xl border border-[rgba(11,22,40,0.09)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#090e1c] text-left">
                      <th className="px-5 py-3 font-semibold text-amber-500">Category</th>
                      <th className="px-5 py-3 font-semibold text-white/50">What it includes</th>
                      <th className="px-5 py-3 font-semibold text-white/50">Why we collect it</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#374560]">
                    <tr className="border-t border-[rgba(11,22,40,0.06)]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Account information</td>
                      <td className="px-5 py-3">Name, email address, phone number</td>
                      <td className="px-5 py-3">To create and manage your account</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)] bg-[#f5f3ef]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Study data</td>
                      <td className="px-5 py-3">MCQ responses, test scores, answers submitted, time spent, streak activity</td>
                      <td className="px-5 py-3">To power analytics, AI evaluation, and personalised recommendations</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Payment data</td>
                      <td className="px-5 py-3">Transaction ID, plan purchased, billing date. Card details are processed by Razorpay and are never stored by us.</td>
                      <td className="px-5 py-3">Subscription management and invoicing</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)] bg-[#f5f3ef]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Device and usage data</td>
                      <td className="px-5 py-3">IP address, browser type, device model, OS, pages visited, session duration</td>
                      <td className="px-5 py-3">Platform security, performance, and debugging</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Communications</td>
                      <td className="px-5 py-3">Support tickets, feedback messages, emails sent to us</td>
                      <td className="px-5 py-3">To respond to your queries and improve the platform</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)] bg-[#f5f3ef]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Uploaded content</td>
                      <td className="px-5 py-3">Handwritten or typed answer images uploaded for AI evaluation</td>
                      <td className="px-5 py-3">To run the Jeet AI Mentor Mains Evaluator and return your score</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <NoteBox icon="🔒">
                <strong>We do not collect</strong> your Aadhaar number, PAN card,
                caste, religion, or any other sensitive personal identifiers. We
                collect only what is necessary to run the platform.
              </NoteBox>
            </div>

            {/* 03 – How We Use It */}
            <div className={sectionGap}>
              <SectionHeading num="03" title="How We Use Your Information" id="s3" />
              <p className={pStyle}>
                Everything we collect is used to make RiseWithJeet work better for
                you. Here is exactly how:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-5">
                <li className={liStyle}>
                  <strong>Running the platform:</strong> Processing your answers,
                  generating performance reports, powering the AI Mains Evaluator, and
                  serving your daily MCQs and current affairs.
                </li>
                <li className={liStyle}>
                  <strong>Personalisation:</strong> Identifying your weak areas,
                  building adaptive test sets, and generating your AI study planner
                  based on your actual progress data.
                </li>
                <li className={liStyle}>
                  <strong>Account and security:</strong> Authenticating your login,
                  sending password reset emails, detecting suspicious activity, and
                  protecting your account.
                </li>
                <li className={liStyle}>
                  <strong>Communication:</strong> Sending study reminders, streak
                  alerts, evaluation results, and important platform updates. You can
                  opt out of non-essential communications from Account Settings at any
                  time.
                </li>
                <li className={liStyle}>
                  <strong>Platform improvement:</strong> Aggregated and anonymised
                  usage data helps us understand which features are most useful and
                  what to build next.
                </li>
                <li className={liStyle}>
                  <strong>Legal and compliance:</strong> Maintaining records required
                  under applicable Indian law, responding to lawful authority requests,
                  and enforcing our Terms of Service.
                </li>
              </ul>
              <NoteBox icon="📋">
                <strong>We do not use your data for advertising.</strong> RiseWithJeet
                does not run ads, and we do not share your personal data with ad
                networks.
              </NoteBox>
            </div>

            {/* 04 – Sharing Your Data */}
            <div className={sectionGap}>
              <SectionHeading num="04" title="Sharing Your Data" id="s4" />
              <p className={pStyle}>
                <strong>We never sell your personal data.</strong> We share it only in
                the following limited circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-5">
                <li className={liStyle}>
                  <strong>Service providers:</strong> We work with trusted third
                  parties to operate the platform. All service providers are bound by
                  data processing agreements and may only use your data to provide
                  services to us.
                </li>
                <li className={liStyle}>
                  <strong>Legal requirements:</strong> We may disclose your information
                  if required by law, court order, or government authority, or if we
                  believe in good faith that disclosure is necessary to protect the
                  rights or safety of RiseWithJeet or its users.
                </li>
              </ul>
            </div>

            {/* 05 – Security */}
            <div className={sectionGap}>
              <SectionHeading num="05" title="Data Security" id="s5" />
              <p className={pStyle}>
                We apply the following safeguards to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-5">
                <li className={liStyle}>
                  <strong>Payment security:</strong> We do not store your card details.
                  All payment processing is handled by Razorpay, which is PCI-DSS
                  compliant.
                </li>
                <li className={liStyle}>
                  <strong>Ongoing security:</strong> We conduct periodic internal
                  security reviews and take prompt action in the event of any suspected
                  data security incident.
                </li>
              </ul>
              <NoteBox icon="🛡️">
                If you discover a security vulnerability, please report it responsibly
                to <strong>together@risewithjeet.com</strong> before disclosing it
                publicly. We take all responsible disclosures seriously.
              </NoteBox>
            </div>

            {/* 06 – Your Rights */}
            <div className={sectionGap}>
              <SectionHeading num="06" title="Your Rights" id="s6" />
              <p className={pStyle}>
                You have meaningful control over your personal data. Here are the
                rights you can exercise at any time:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
                {[
                  { icon: '👁️', title: 'Access', body: 'Access your personal data and information.' },
                  { icon: '✏️', title: 'Correction', body: 'Ask us to correct inaccurate or incomplete data in your account at any time.' },
                  { icon: '🗑️', title: 'Deletion', body: 'Request deletion of your account and all associated personal data. We will process this promptly.' },
                  { icon: '📦', title: 'Portability', body: 'Export your study data, scores, and evaluation history in a portable format.' },
                  { icon: '🚫', title: 'Restriction', body: 'Ask us to stop processing your data for specific purposes, such as analytics or promotional communications.' },
                  { icon: '🔕', title: 'Opt-out', body: 'Unsubscribe from non-essential emails and notifications at any time from Account Settings.' },
                ].map((right) => (
                  <div
                    key={right.title}
                    className="rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5"
                  >
                    <span className="text-xl">{right.icon}</span>
                    <h3 className="text-sm font-semibold text-[#0c1424] mt-2 mb-1">
                      {right.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-[#6b7a99]">
                      {right.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className={pStyle}>
                To exercise any of these rights, email us at{' '}
                <a
                  href="mailto:together@risewithjeet.com"
                  className="underline underline-offset-2 hover:text-[#0c1424]"
                >
                  together@risewithjeet.com
                </a>{' '}
                from your registered email address. There is no charge for exercising
                your rights.
              </p>
            </div>

            {/* 07 – Cookies */}
            <div className={sectionGap}>
              <SectionHeading num="07" title="Cookies" id="s7" />
              <p className={pStyle}>
                We use cookies to keep you logged in, remember your preferences, and
                understand how the platform is being used.
              </p>

              <div className="overflow-x-auto my-5 rounded-xl border border-[rgba(11,22,40,0.09)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#090e1c] text-left">
                      <th className="px-5 py-3 font-semibold text-amber-500">Cookie type</th>
                      <th className="px-5 py-3 font-semibold text-white/50">Purpose</th>
                      <th className="px-5 py-3 font-semibold text-white/50">Can you opt out</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#374560]">
                    <tr className="border-t border-[rgba(11,22,40,0.06)]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Essential</td>
                      <td className="px-5 py-3">Login session, CSRF protection, security tokens</td>
                      <td className="px-5 py-3">No, these are required for the platform to function</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)] bg-[#f5f3ef]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Preference</td>
                      <td className="px-5 py-3">Language settings, timezone, theme preference</td>
                      <td className="px-5 py-3">Yes, via Account Settings</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Analytics</td>
                      <td className="px-5 py-3">Page views, feature usage, session duration (anonymised)</td>
                      <td className="px-5 py-3">Yes, via Account Settings or browser settings</td>
                    </tr>
                    <tr className="border-t border-[rgba(11,22,40,0.06)] bg-[#f5f3ef]">
                      <td className="px-5 py-3 font-medium text-[#0c1424]">Marketing</td>
                      <td className="px-5 py-3">We do not currently use marketing or advertising cookies</td>
                      <td className="px-5 py-3">Not applicable</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className={pStyle}>
                You can also control cookies through your browser settings. Note that
                disabling essential cookies will log you out of the platform.
              </p>
            </div>

            {/* 08 – Children */}
            <div className={sectionGap}>
              <SectionHeading num="08" title="Children&rsquo;s Privacy" id="s8" />
              <p className={pStyle}>
                RiseWithJeet is intended for users who are 13 years of age or older. We
                do not knowingly collect personal data from anyone under the age of 13.
              </p>
              <p className={pStyle}>
                If you are a parent or guardian and believe your child has provided
                personal data to us without your consent, please contact us at{' '}
                <a
                  href="mailto:together@risewithjeet.com"
                  className="underline underline-offset-2 hover:text-[#0c1424]"
                >
                  together@risewithjeet.com
                </a>{' '}
                and we will promptly delete that information from our systems.
              </p>
            </div>

            {/* 09 – Changes */}
            <div className={sectionGap}>
              <SectionHeading num="09" title="Changes to This Policy" id="s9" />
              <p className={pStyle}>
                We may update this Privacy Policy from time to time as our platform
                evolves. When we make changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-5">
                <li className={liStyle}>
                  Update the &ldquo;Last updated&rdquo; date at the top of this page
                </li>
                <li className={liStyle}>
                  Send a notification to your registered email address if the changes
                  are material
                </li>
                <li className={liStyle}>
                  Display a notice on the platform so you are aware of what has changed
                </li>
              </ul>
              <p className={pStyle}>
                Continued use of RiseWithJeet after changes are posted means you accept
                the updated policy. If you disagree with a change, you may delete your
                account and stop using the platform.
              </p>
            </div>

            {/* 10 – Contact Us */}
            <div className={sectionGap}>
              <SectionHeading num="10" title="Contact Us" id="s10" />
              <p className={pStyle}>
                If you have any questions, concerns, or requests related to your
                privacy, please reach out to us. We take every message seriously.
              </p>
              <InfoBox icon="📬">
                Privacy and Security Issues:{' '}
                <a
                  href="mailto:together@risewithjeet.com"
                  className="underline underline-offset-2 hover:text-[#0c1424]"
                >
                  together@risewithjeet.com
                </a>
              </InfoBox>
              <p className={pStyle}>
                If you feel your concern has not been adequately addressed, you have
                the right to lodge a complaint with the relevant data protection
                authority in India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF8F4] py-16">
        <div className="mx-auto max-w-2xl px-6">
          <div
            className="relative overflow-hidden rounded-[24px] px-8 py-16 text-center"
            style={{
              backgroundImage: 'linear-gradient(135deg, #0b1530 0%, #0f2050 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 40px 80px rgba(11,29,58,0.24)',
            }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-[320px] w-[320px] rounded-full" style={{ background: 'rgba(232,184,75,0.06)' }} />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-[50px] -right-[82px] h-[250px] w-[250px] rounded-full" style={{ background: 'rgba(46,93,179,0.08)' }} />
            <div className="relative z-10">
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-1.2px',
                  color: '#fff',
                }}
              >
                Questions about your
                <br />
                <em style={{ fontStyle: 'italic', color: '#e8b84b' }}>Data or Privacy?</em>
              </h2>
              <p className="mx-auto mt-4 max-w-[489px]" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.65 }}>
                We keep it simple and honest. Reach out if anything is unclear.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <a
                  href="mailto:together@risewithjeet.com"
                  className="rounded-xl px-8 py-3.5 text-[15.5px] font-bold transition hover:brightness-105 hover:-translate-y-0.5"
                  style={{
                    backgroundImage: 'linear-gradient(144deg, #e8b84b 0%, #b8780a 100%)',
                    color: '#0b1530',
                    filter: 'drop-shadow(0 8px 14px rgba(232,184,75,0.38))',
                  }}
                >
                  Email: together@risewithjeet.com
                </a>
                <Link
                  href="/contact"
                  className="rounded-xl px-8 py-3.5 text-[15.5px] font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
