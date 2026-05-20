import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy | RiseWithJeet',
  description: 'Understand the refund and cancellation policy for RiseWithJeet subscriptions.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="bg-[#090e1c] pt-28 pb-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.12)] px-4 py-1.5 text-sm text-[#e8b84b]">
            <span>↩️</span> Refund Policy
          </div>
          <div className="mb-4 flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-[#9aa3b8]">
            <span className="h-px w-8 bg-[#9aa3b8] opacity-40" />
            Transparent and Fair
            <span className="h-px w-8 bg-[#9aa3b8] opacity-40" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
            Refund and <em className="text-[#e8b84b] not-italic">Cancellation</em>
          </h1>
          <p className="mt-4 text-sm text-[#9aa3b8]">
            <strong className="text-[#d0d5e0]">Effective date:</strong> February 1, 2025 &nbsp;&middot;&nbsp;{' '}
            <strong className="text-[#d0d5e0]">Last updated:</strong> 1 May, 2026
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#faf8f4] py-16">
        <div className="mx-auto flex max-w-5xl gap-12 px-6 lg:px-8">

          {/* Table of Contents - sidebar */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7a99]">Contents</div>
              <nav className="flex flex-col gap-1.5 text-sm">
                <a href="#our-approach" className="rounded-md px-3 py-1.5 text-[#374560] transition hover:bg-[rgba(11,22,40,0.06)]">
                  <span className="mr-2 text-xs text-[#9aa3b8]">01</span>Our Approach
                </a>
                <a href="#cancellations" className="rounded-md px-3 py-1.5 text-[#374560] transition hover:bg-[rgba(11,22,40,0.06)]">
                  <span className="mr-2 text-xs text-[#9aa3b8]">02</span>Cancellations
                </a>
                <a href="#within-7-days" className="rounded-md px-3 py-1.5 text-[#374560] transition hover:bg-[rgba(11,22,40,0.06)]">
                  <span className="mr-2 text-xs text-[#9aa3b8]">03</span>Within 7 Days
                </a>
                <a href="#after-7-days" className="rounded-md px-3 py-1.5 text-[#374560] transition hover:bg-[rgba(11,22,40,0.06)]">
                  <span className="mr-2 text-xs text-[#9aa3b8]">04</span>After 7 Days
                </a>
                <a href="#how-to-request" className="rounded-md px-3 py-1.5 text-[#374560] transition hover:bg-[rgba(11,22,40,0.06)]">
                  <span className="mr-2 text-xs text-[#9aa3b8]">05</span>How to Request
                </a>
                <a href="#contact-us" className="rounded-md px-3 py-1.5 text-[#374560] transition hover:bg-[rgba(11,22,40,0.06)]">
                  <span className="mr-2 text-xs text-[#9aa3b8]">06</span>Contact Us
                </a>
              </nav>
              <div className="mt-6 border-t border-[rgba(11,22,40,0.09)] pt-4">
                <div className="text-xs font-medium text-[#6b7a99]">Billing queries</div>
                <div className="mt-1 text-sm text-[#374560]">together@risewithjeet.com</div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 max-w-[800px] flex-1">

            {/* Section 1: Our Approach */}
            <section id="our-approach" className="mb-14 scroll-mt-24">
              <div className="mb-1 text-xs font-semibold text-[#9aa3b8]">01</div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-[#0c1424] md:text-3xl">Our Approach</h2>

              <div className="mb-6 flex gap-3 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                <div className="text-xl">💛</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  <strong className="text-[#0c1424]">We want you to feel confident trying RiseWithJeet.</strong> If the platform is not right for you, we will do our best to make it right. This policy explains exactly how cancellations and refunds work.
                </div>
              </div>

              <p className="mb-4 text-base leading-relaxed text-[#374560]">
                We built RiseWithJeet with one belief: you should only pay for something that genuinely helps you prepare. We price the platform at what it costs to run, not what the market will bear. That same thinking applies to refunds. We are not in the business of trapping people into subscriptions they do not want.
              </p>
              <p className="mb-6 text-base leading-relaxed text-[#374560]">
                At the same time, running this platform, training AI models on UPSC-specific content, and maintaining infrastructure has real costs. This policy reflects that balance honestly.
              </p>

              {/* Guarantee card */}
              <div className="rounded-xl border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.06)] p-6">
                <div className="flex gap-4">
                  <div className="text-2xl">🛡️</div>
                  <div>
                    <div className="mb-2 text-lg font-bold text-[#0c1424]">7-Day Money-Back Guarantee</div>
                    <p className="mb-3 text-sm leading-relaxed text-[#374560]">
                      We offer a full, no-questions-asked refund within 7 days of your initial subscription payment. This applies to all paid plans: Rise Plan and Ascent Plan.
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
              <div className="mb-1 text-xs font-semibold text-[#9aa3b8]">02</div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-[#0c1424] md:text-3xl">Cancellations</h2>

              <p className="mb-4 text-base leading-relaxed text-[#374560]">
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

              <div className="flex gap-3 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                <div className="text-xl">💡</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  If you are going through a tough period and need a break, consider pausing rather than cancelling. Write to us at <strong className="text-[#0c1424]">together@risewithjeet.com</strong> and we will see what we can do.
                </div>
              </div>
            </section>

            {/* Section 3: Within the 7-Day Window */}
            <section id="within-7-days" className="mb-14 scroll-mt-24">
              <div className="mb-1 text-xs font-semibold text-[#9aa3b8]">03</div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-[#0c1424] md:text-3xl">Within the 7-Day Window</h2>

              <p className="mb-4 text-base leading-relaxed text-[#374560]">
                If you request a refund within 7 days of your initial subscription payment, we will process it in full with no questions asked. This applies to both the Rise and Ascent plans.
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

              <div className="flex gap-3 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                <div className="text-xl">📌</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  The 7-day window starts from the date of your initial payment, not from when you first log in or activate features.
                </div>
              </div>
            </section>

            {/* Section 4: After the 7-Day Window */}
            <section id="after-7-days" className="mb-14 scroll-mt-24">
              <div className="mb-1 text-xs font-semibold text-[#9aa3b8]">04</div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-[#0c1424] md:text-3xl">After the 7-Day Window</h2>

              <p className="mb-6 text-base leading-relaxed text-[#374560]">
                After the initial 7 days, we do not offer pro-rated refunds for unused subscription time. However, we review every situation with common sense. We will evaluate refund requests case by case for the following:
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
                    <span>❌</span> Not eligible after 7 days
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-[#374560]">
                    <p>Change of mind or a decision to pause preparation</p>
                    <p>Renewal charges on a subscription you forgot to cancel</p>
                    <p>Partial use where features were available and working</p>
                    <p>Mentorship session fees once a session has taken place</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                <div className="text-xl">📋</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  If your situation is not listed here, please write to us anyway. We look at each request individually and respond fairly.
                </div>
              </div>
            </section>

            {/* Section 5: How to Request a Refund */}
            <section id="how-to-request" className="mb-14 scroll-mt-24">
              <div className="mb-1 text-xs font-semibold text-[#9aa3b8]">05</div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-[#0c1424] md:text-3xl">How to Request a Refund</h2>

              <p className="mb-6 text-base leading-relaxed text-[#374560]">
                The process is simple and handled by a real person, not a bot.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#090e1c] text-sm font-bold text-[#e8b84b]">1</div>
                  <div>
                    <div className="mb-1 font-semibold text-[#0c1424]">Email us</div>
                    <p className="text-sm leading-relaxed text-[#374560]">
                      Write to <a href="mailto:together@risewithjeet.com" className="font-medium text-[#0c1424] underline">together@risewithjeet.com</a> from your registered email address. Use the subject line &quot;Refund Request&quot; and include your full name and a brief explanation of why you are requesting a refund.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#090e1c] text-sm font-bold text-[#e8b84b]">2</div>
                  <div>
                    <div className="mb-1 font-semibold text-[#0c1424]">We review and respond</div>
                    <p className="text-sm leading-relaxed text-[#374560]">
                      Our team member reviews your request. We may ask a follow-up question if needed to understand your situation better.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
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
              <div className="mb-1 text-xs font-semibold text-[#9aa3b8]">06</div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-[#0c1424] md:text-3xl">Contact Us</h2>

              <p className="mb-4 text-base leading-relaxed text-[#374560]">
                For any billing or refund queries, please reach out directly. We respond as quickly as possible on working days.
              </p>

              <div className="mb-6 flex gap-3 rounded-xl border border-[rgba(11,22,40,0.09)] bg-white p-5">
                <div className="text-xl">📬</div>
                <div className="text-sm leading-relaxed text-[#374560]">
                  Billing and refunds:{' '}
                  <a href="mailto:together@risewithjeet.com" className="font-medium text-[#172444] underline">together@risewithjeet.com</a>
                </div>
              </div>

              <p className="text-base leading-relaxed text-[#374560]">
                This policy may be updated from time to time. The &quot;Last updated&quot; date at the top of this page will reflect any changes.
              </p>
            </section>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#faf8f4] py-16">
        <div className="mx-auto max-w-xl px-6">
          <div className="rounded-2xl bg-[#090e1c] px-8 py-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-white">
              Need help with a<br /><em className="text-[#e8b84b] not-italic">refund or cancellation?</em>
            </h2>
            <p className="mt-4 text-[#9aa3b8]">
              Write to us directly. A real person reads every message and gets back to you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:together@risewithjeet.com"
                className="rounded-lg bg-[#e8b84b] px-6 py-3 text-sm font-semibold text-[#090e1c] transition hover:bg-[#f5ce72]"
              >
                Email together@risewithjeet.com
              </a>
              <Link
                href="/contact"
                className="rounded-lg border border-[rgba(255,255,255,0.15)] px-6 py-3 text-sm font-semibold text-white transition hover:border-[rgba(255,255,255,0.3)]"
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
