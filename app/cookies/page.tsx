import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';
import CompanyPageToc from '@/components/CompanyPageToc';
// Shared `.lc-*` typography system — identical values to the Terms of Use and
// Privacy pages. Replaces the one-off inline styles this page used before.
import '../legal-content.css';

export const metadata: Metadata = {
  title: 'Cookie Policy | RiseWithJeet',
  description:
    'Learn about how RiseWithJeet uses cookies and how you can manage your preferences.',
};

const tocItems = [
  { id: 'sec1', num: '01', label: 'What Are Cookies' },
  { id: 'sec2', num: '02', label: 'What We Use' },
  { id: 'sec3', num: '03', label: 'Cookie Table' },
  { id: 'sec4', num: '04', label: 'Your Choices' },
  { id: 'sec5', num: '05', label: 'Changes' },
  { id: 'sec6', num: '06', label: 'Contact' },
];

/* ------------------------------------------------------------------ */

/* Section number / heading / body copy are now driven by the shared
   `.lc-num`, `.lc-h2` and `.lc-p` classes in legal-content.css, so this page
   uses the exact serif heading + type scale of the Terms of Use page. */

function SectionNumber({ n }: { n: string }) {
  return <div className="lc-num">{n}</div>;
}

// Gold callout — .lc-info matches the Terms/Privacy "Short version" box.
function InfoBox({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lc-info">
      <span className="lc-info-ico">{icon}</span>
      <div className="lc-info-txt">{children}</div>
    </div>
  );
}

// Navy callout — .lc-note matches the Terms/Privacy warning box.
function NoteBox({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="lc-note">
      <span className="lc-note-ico">{icon}</span>
      <div className="lc-note-txt">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function CookiePolicyPage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#090e1c] pt-32 pb-20 text-center text-white">
        {/* Grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Golden glow top-left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 65%)' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-300">
            <span>&#x1F36A;</span> Cookies &amp; Tracking
          </div>

          <div className="mb-3 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-400/70">
            <span className="h-px w-8 bg-amber-400/30" />
            Simple, Transparent &amp; Secure
            <span className="h-px w-8 bg-amber-400/30" />
          </div>

          {/* clamp() resolves to 3.8rem/1.15 = the Terms hero's 60.8px/69.92px on
              desktop, but scales down instead of overflowing on small screens. */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', fontWeight: 600, lineHeight: 1.15 }}>
            Cookie <em style={{ color: '#E8B84B', fontStyle: 'italic', fontWeight: 400 }}>Policy</em>
          </h1>

          <p className="mt-4" style={{ fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: '20.80px' }}>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>Effective date:</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}> February 1, 2025 &nbsp;&middot;&nbsp; </span>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>Last updated:</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}> May 1, 2026</span>
          </p>
        </div>
      </section>

      {/* Body — `legal-page` scopes the shared .lc-* typography to this page.
          White surface matches the Terms of Use body (the cream tone is used by
          the list cards and alternating table rows inside it). */}
      <section className="legal-page bg-white py-16 sm:py-24">
        <div className="mx-auto flex max-w-5xl gap-12 px-6 lg:px-8">
          <CompanyPageToc
            ariaLabel="Cookie policy contents"
            items={tocItems}
            contactLabel="Questions?"
            contactValue="together@risewithjeet.com"
            contactHref="mailto:together@risewithjeet.com"
            variant="legal"
          />

          {/* Main content — section spacing now comes from .lc-sec (44px +
              divider), matching Terms, so the space-y-* wrappers are gone. */}
          <div className="min-w-0 max-w-2xl">
            {/* Section 1 */}
            <section id="sec1" className="lc-sec">
              <SectionNumber n="01" />
              <h2 className="lc-h2">
                What Are Cookies
              </h2>

              <InfoBox icon="&#x1F4A1;">
                <strong>Short version:</strong> Cookies are small files stored
                on your device that help the platform remember you and work
                properly. We use them minimally and only for things that
                genuinely improve your experience.
              </InfoBox>

              <p className="lc-p">
                When you visit RiseWithJeet, small text files called cookies may
                be stored on your browser or device. These help the platform
                recognise you between sessions, remember your preferences, and
                understand how features are being used so we can keep improving
                them.
              </p>
              <p className="lc-p">
                We also use similar technologies like local storage and session
                tokens for authentication purposes. In this policy, we refer to
                all of these collectively as &ldquo;cookies&rdquo; for
                simplicity.
              </p>
            </section>

            {/* Section 2 */}
            <section id="sec2" className="lc-sec">
              <SectionNumber n="02" />
              <h2 className="lc-h2">
                What We Use and Why
              </h2>
              <p className="lc-p">
                We keep our cookie usage lean. Here is a plain-language breakdown
                of what we use and why:
              </p>
              {/* strong + span siblings (not inline text) so the shared
                  .lc-list li:has(strong) grid can lay out label:description
                  columns exactly like the Terms of Use list items. */}
              <ul className="lc-list">
                <li>
                  <strong>Essential cookies:</strong>
                  <span>These are required for the platform to function. They
                  keep you logged in, protect against CSRF attacks, and manage
                  your session securely. You cannot opt out of these without
                  logging out.</span>
                </li>
                <li>
                  <strong>Preference cookies:</strong>
                  <span>These remember settings you have chosen, like your
                  language preference or notification settings, so you do not
                  have to reset them every time you visit. You can turn these
                  off from Account Settings.</span>
                </li>
                <li>
                  <strong>Analytics cookies:</strong>
                  <span>These help us understand how aspirants use the
                  platform. Which features are most useful? Where do people get
                  stuck? The data is anonymised and used only to improve the
                  product. You can opt out from Account Settings or your
                  browser settings.</span>
                </li>
                <li>
                  <strong>Marketing cookies:</strong>
                  <span>We do not use marketing or advertising cookies. We do
                  not run ads and we do not share your data with ad
                  networks.</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="sec3" className="lc-sec">
              <SectionNumber n="03" />
              <h2 className="lc-h2">
                Cookie Reference Table
              </h2>
              <p className="lc-p">
                A clear breakdown of every category of cookie we use:
              </p>

              {/* Table typography moved onto .lc-tbl (13px body / 11px uppercase
                  head); the wrapper still scrolls horizontally on mobile. */}
              <div className="lc-tbl-wrap">
                <table className="lc-tbl">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>What it does</th>
                      <th>Set by</th>
                      <th>Can you opt out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Essential</td>
                      <td>
                        Keeps you logged in, protects against CSRF attacks,
                        manages your active session
                      </td>
                      <td>RiseWithJeet</td>
                      <td>
                        <span className="lc-tag bg-amber-100 text-amber-800">
                          Required
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Preference</td>
                      <td>
                        Remembers your language, timezone, and notification
                        preferences between sessions
                      </td>
                      <td>RiseWithJeet</td>
                      <td>
                        <span className="lc-tag bg-green-100 text-green-800">
                          Optional
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Analytics</td>
                      <td>
                        Tracks anonymised usage patterns such as page views,
                        feature usage, and session duration to help us improve
                        the platform
                      </td>
                      <td>
                        RiseWithJeet / third-party tools
                      </td>
                      <td>
                        <span className="lc-tag bg-green-100 text-green-800">
                          Optional
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Authentication</td>
                      <td>
                        Manages your login state and secure token when using
                        Google or Microsoft sign-in
                      </td>
                      <td>Firebase / OAuth provider</td>
                      <td>
                        <span className="lc-tag bg-amber-100 text-amber-800">
                          Required
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Marketing</td>
                      <td>
                        Not used. We do not run ads or use advertising trackers.
                      </td>
                      <td>None</td>
                      <td>
                        <span className="lc-tag bg-slate-100 text-slate-500">
                          Not applicable
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <NoteBox icon="&#x1F512;">
                We do not use cookies to track you across other websites, build
                advertising profiles, or sell your data to any third party.
              </NoteBox>
            </section>

            {/* Section 4 */}
            <section id="sec4" className="lc-sec">
              <SectionNumber n="04" />
              <h2 className="lc-h2">
                Your Choices
              </h2>
              <p className="lc-p">
                You are always in control. Here are the ways you can manage
                cookies on RiseWithJeet:
              </p>
              <ul className="lc-list">
                <li>
                  <strong>Account Settings:</strong>
                  <span>Go to Account Settings and select Privacy. You can turn
                  off optional analytics and preference cookies from there
                  without affecting your core experience.</span>
                </li>
                <li>
                  <strong>Browser settings:</strong>
                  <span>Every major browser lets you view, delete, and block
                  cookies. Note that blocking essential cookies will log you
                  out and may affect how the platform works. Check your
                  browser&apos;s help documentation for specific steps.</span>
                </li>
                <li>
                  <strong>Clearing cookies:</strong>
                  <span>You can clear all stored cookies from your browser at
                  any time. You will need to log in again after doing so.</span>
                </li>
              </ul>

              <NoteBox icon="&#x26A0;&#xFE0F;">
                Disabling essential or authentication cookies will prevent you
                from staying logged in. The core features of the platform require
                these to function correctly.
              </NoteBox>
            </section>

            {/* Section 5 */}
            <section id="sec5" className="lc-sec">
              <SectionNumber n="05" />
              <h2 className="lc-h2">
                Changes to This Policy
              </h2>
              <p className="lc-p">
                If we add new cookies or change how we use existing ones, we will
                update this page and revise the &ldquo;Last updated&rdquo; date
                above. If the changes are significant, we will let you know
                through the platform or by email.
              </p>
              <p className="lc-p">
                Continued use of RiseWithJeet after an update means you are
                comfortable with the changes. If you are not, you can manage your
                preferences from Account Settings or reach out to us.
              </p>
            </section>

            {/* Section 6 */}
            <section id="sec6" className="lc-sec">
              <SectionNumber n="06" />
              <h2 className="lc-h2">
                Contact Us
              </h2>
              <p className="lc-p">
                If you have questions about how we use cookies or want to
                understand more about a specific technology we use, please get in
                touch.
              </p>
              <InfoBox
                icon={
                  <Image
                    src="/emm.png"
                    alt="Mail"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                }
              >
                <strong>Jeetpath Academy Pvt. Ltd.</strong>
                <br />
                Privacy and cookie queries:{' '}
                {/* Link colour/underline now come from .lc-info-txt a */}
                <a href="mailto:together@risewithjeet.com">
                  together@risewithjeet.com
                </a>
              </InfoBox>
              <p className="lc-p lc-p--fine">
                This policy may be updated from time to time. The &ldquo;Last updated&rdquo; date at the top of this page will reflect any changes.
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* CTA — white surface, matching the Terms of Use CTA wrapper */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6">
          <div
            className="relative overflow-hidden rounded-[24px] px-8 py-16 text-center"
            style={{
              backgroundImage: 'linear-gradient(135deg, #0b1530 0%, #0f2050 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 40px 80px rgba(11,29,58,0.24)',
            }}
          >
            {/* Decorative overlays */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-20 h-[320px] w-[320px] rounded-full"
              style={{ background: 'rgba(232,184,75,0.06)' }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[50px] -right-[82px] h-[250px] w-[250px] rounded-full"
              style={{ background: 'rgba(46,93,179,0.08)' }}
            />

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
                Questions about
                <br />
                <em style={{ fontStyle: 'italic', color: '#e8b84b' }}>Cookies or Privacy?</em>
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
