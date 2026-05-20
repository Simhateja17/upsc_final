import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Cookie Policy | RiseWithJeet',
  description:
    'Learn about how RiseWithJeet uses cookies and how you can manage your preferences.',
};

/* ------------------------------------------------------------------ */

function SectionNumber({ n }: { n: string }) {
  return (
    <span className="font-mono text-sm text-amber-600/60 tracking-wider">
      {n}
    </span>
  );
}

function InfoBox({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-[15px] leading-relaxed">
      <span className="text-xl shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function NoteBox({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-[15px] leading-relaxed">
      <span className="text-xl shrink-0">{icon}</span>
      <div>{children}</div>
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
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-300">
            <span>&#x1F36A;</span> Cookies &amp; Tracking
          </div>

          <div className="mb-3 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-amber-400/70">
            <span className="h-px w-8 bg-amber-400/30" />
            Simple, Transparent &amp; Secure
            <span className="h-px w-8 bg-amber-400/30" />
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Cookie <em className="text-amber-400 not-italic">Policy</em>
          </h1>

          <p className="mt-4 text-sm text-slate-400">
            <strong className="text-slate-300">Effective date:</strong>{' '}
            February 1, 2025 &nbsp;&middot;&nbsp;{' '}
            <strong className="text-slate-300">Last updated:</strong> 1 May,
            2026
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#faf8f4] py-16 sm:py-24">
        <div className="mx-auto flex max-w-5xl gap-12 px-6 lg:px-8">
          {/* Table of Contents (desktop sidebar) */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Contents
            </p>
            <nav className="flex flex-col gap-1.5 text-sm">
              {[
                ['#sec1', '01', 'What Are Cookies'],
                ['#sec2', '02', 'What We Use'],
                ['#sec3', '03', 'Cookie Table'],
                ['#sec4', '04', 'Your Choices'],
                ['#sec5', '05', 'Changes'],
                ['#sec6', '06', 'Contact'],
              ].map(([href, num, label]) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-white hover:text-slate-900"
                >
                  <span className="font-mono text-xs text-amber-600/60">
                    {num}
                  </span>
                  {label}
                </a>
              ))}
            </nav>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Questions?
              </p>
              <a
                href="mailto:together@risewithjeet.com"
                className="mt-1 block text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
              >
                together@risewithjeet.com
              </a>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 max-w-2xl space-y-14">
            {/* Section 1 */}
            <section id="sec1" className="scroll-mt-24 space-y-5">
              <SectionNumber n="01" />
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                What Are Cookies
              </h2>

              <InfoBox icon="&#x1F4A1;">
                <strong>Short version:</strong> Cookies are small files stored
                on your device that help the platform remember you and work
                properly. We use them minimally and only for things that
                genuinely improve your experience.
              </InfoBox>

              <p className="text-slate-700 leading-relaxed">
                When you visit RiseWithJeet, small text files called cookies may
                be stored on your browser or device. These help the platform
                recognise you between sessions, remember your preferences, and
                understand how features are being used so we can keep improving
                them.
              </p>
              <p className="text-slate-700 leading-relaxed">
                We also use similar technologies like local storage and session
                tokens for authentication purposes. In this policy, we refer to
                all of these collectively as &ldquo;cookies&rdquo; for
                simplicity.
              </p>
            </section>

            {/* Section 2 */}
            <section id="sec2" className="scroll-mt-24 space-y-5">
              <SectionNumber n="02" />
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                What We Use and Why
              </h2>
              <p className="text-slate-700 leading-relaxed">
                We keep our cookie usage lean. Here is a plain-language breakdown
                of what we use and why:
              </p>
              <ul className="list-disc space-y-3 pl-5 text-slate-700 leading-relaxed marker:text-amber-500">
                <li>
                  <strong>Essential cookies:</strong> These are required for the
                  platform to function. They keep you logged in, protect against
                  CSRF attacks, and manage your session securely. You cannot opt
                  out of these without logging out.
                </li>
                <li>
                  <strong>Preference cookies:</strong> These remember settings
                  you have chosen, like your language preference or notification
                  settings, so you do not have to reset them every time you
                  visit. You can turn these off from Account Settings.
                </li>
                <li>
                  <strong>Analytics cookies:</strong> These help us understand
                  how aspirants use the platform. Which features are most useful?
                  Where do people get stuck? The data is anonymised and used only
                  to improve the product. You can opt out from Account Settings
                  or your browser settings.
                </li>
                <li>
                  <strong>Marketing cookies:</strong> We do not use marketing or
                  advertising cookies. We do not run ads and we do not share your
                  data with ad networks.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="sec3" className="scroll-mt-24 space-y-5">
              <SectionNumber n="03" />
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Cookie Reference Table
              </h2>
              <p className="text-slate-700 leading-relaxed">
                A clear breakdown of every category of cookie we use:
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">What it does</th>
                      <th className="px-5 py-3">Set by</th>
                      <th className="px-5 py-3">Can you opt out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-5 py-3 font-medium">Essential</td>
                      <td className="px-5 py-3">
                        Keeps you logged in, protects against CSRF attacks,
                        manages your active session
                      </td>
                      <td className="px-5 py-3">RiseWithJeet</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Required
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-medium">Preference</td>
                      <td className="px-5 py-3">
                        Remembers your language, timezone, and notification
                        preferences between sessions
                      </td>
                      <td className="px-5 py-3">RiseWithJeet</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Optional
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-medium">Analytics</td>
                      <td className="px-5 py-3">
                        Tracks anonymised usage patterns such as page views,
                        feature usage, and session duration to help us improve
                        the platform
                      </td>
                      <td className="px-5 py-3">
                        RiseWithJeet / third-party tools
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Optional
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-medium">Authentication</td>
                      <td className="px-5 py-3">
                        Manages your login state and secure token when using
                        Google or Microsoft sign-in
                      </td>
                      <td className="px-5 py-3">Firebase / OAuth provider</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Required
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-medium">Marketing</td>
                      <td className="px-5 py-3">
                        Not used. We do not run ads or use advertising trackers.
                      </td>
                      <td className="px-5 py-3">None</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
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
            <section id="sec4" className="scroll-mt-24 space-y-5">
              <SectionNumber n="04" />
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Your Choices
              </h2>
              <p className="text-slate-700 leading-relaxed">
                You are always in control. Here are the ways you can manage
                cookies on RiseWithJeet:
              </p>
              <ul className="list-disc space-y-3 pl-5 text-slate-700 leading-relaxed marker:text-amber-500">
                <li>
                  <strong>Account Settings:</strong> Go to Account Settings and
                  select Privacy. You can turn off optional analytics and
                  preference cookies from there without affecting your core
                  experience.
                </li>
                <li>
                  <strong>Browser settings:</strong> Every major browser lets you
                  view, delete, and block cookies. Note that blocking essential
                  cookies will log you out and may affect how the platform works.
                  Check your browser&apos;s help documentation for specific
                  steps.
                </li>
                <li>
                  <strong>Clearing cookies:</strong> You can clear all stored
                  cookies from your browser at any time. You will need to log in
                  again after doing so.
                </li>
              </ul>

              <NoteBox icon="&#x26A0;&#xFE0F;">
                Disabling essential or authentication cookies will prevent you
                from staying logged in. The core features of the platform require
                these to function correctly.
              </NoteBox>
            </section>

            {/* Section 5 */}
            <section id="sec5" className="scroll-mt-24 space-y-5">
              <SectionNumber n="05" />
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Changes to This Policy
              </h2>
              <p className="text-slate-700 leading-relaxed">
                If we add new cookies or change how we use existing ones, we will
                update this page and revise the &ldquo;Last updated&rdquo; date
                above. If the changes are significant, we will let you know
                through the platform or by email.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Continued use of RiseWithJeet after an update means you are
                comfortable with the changes. If you are not, you can manage your
                preferences from Account Settings or reach out to us.
              </p>
            </section>

            {/* Section 6 */}
            <section id="sec6" className="scroll-mt-24 space-y-5">
              <SectionNumber n="06" />
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Contact Us
              </h2>
              <p className="text-slate-700 leading-relaxed">
                If you have questions about how we use cookies or want to
                understand more about a specific technology we use, please get in
                touch.
              </p>

              <InfoBox icon="&#x1F4EC;">
                Privacy and cookie queries:{' '}
                <a
                  href="mailto:together@risewithjeet.com"
                  className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-amber-400"
                >
                  together@risewithjeet.com
                </a>
              </InfoBox>

              <p className="text-slate-700 leading-relaxed">
                This policy may be updated from time to time. The &ldquo;Last updated&rdquo; date at the top of this page will reflect any changes.
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#faf8f4] py-16">
        <div className="mx-auto max-w-xl px-6">
          <div className="rounded-2xl bg-[#090e1c] px-8 py-12 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Questions about
              <br />
              <em className="text-amber-400 not-italic">
                cookies or privacy?
              </em>
            </h2>
            <p className="mt-4 text-slate-400">
              We keep it simple and honest. Reach out if anything is unclear.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:together@risewithjeet.com"
                className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
              >
                Email together@risewithjeet.com
              </a>
              <Link
                href="/contact"
                className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
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
