'use client';

import Image from 'next/image';
import Link from 'next/link';

const socialLinks = {
  youtube: 'https://www.youtube.com/@RisewithJeet',
  instagram: 'https://www.instagram.com/risewithjeet',
  whatsapp: 'https://wa.me/918357056891',
  x: 'https://x.com/risewithjeet',
  facebook: 'https://www.facebook.com/risewithjeet',
  linkedin: 'https://www.linkedin.com/company/risewithjeet',
  telegram: 'https://t.me/togetherrisewithjeet',
  telegramCommunity: 'https://t.me/risewithjeet',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.risewithjeet',
  appStore: 'https://apps.apple.com/app/risewithjeet',
};

const linkClass = 'inline-flex items-center py-1 text-[13px] text-white/60 transition hover:text-white';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#000E2D] before:absolute before:left-[5%] before:right-[5%] before:top-0 before:h-px before:bg-white/8 before:content-['']">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="relative grid grid-cols-1 gap-8 py-10 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] xl:gap-0 after:absolute after:bottom-0 after:left-[5%] after:right-[5%] after:h-px after:bg-white/8 after:content-['']">
          {/* Brand Column */}
          <div className="pr-0 xl:pr-8">
            <Image src="/footer-logo-new.png" alt="RiseWithJeet" width={320} height={64} className="h-auto w-[260px]" priority />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.55)]">
              Your IAS dream, powered by Jeet Intelligence.
            </p>
            <p className="mt-5 max-w-[320px] text-[15px] leading-[1.6] text-[rgba(255,255,255,0.56)]">
              Rise With Jeet is redefining UPSC preparation with a simplified, smarter approach. As India&apos;s leading AI-powered platform, we combine cutting-edge technology, high-quality content, expert guidance, and innovative tools to deliver an effective learning experience.
            </p>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Download the app</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={socialLinks.googlePlay} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#EA4335"/><path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#FBBC04"/><path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" fill="#4285F4"/><path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#34A853"/></svg>
                Google Play
              </a>
              <a href={socialLinks.appStore} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.96 6.61C11.82 5.46 12.36 4.26 13 3.5Z" fill="white"/></svg>
                App Store
              </a>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Follow us</p>
            <div className="mt-3 flex items-center gap-2">
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" fill="#FF0000"/></svg>
              </a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E4405F"/></svg>
              </a>
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366"/></svg>
              </a>
              <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/></svg>
              </a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg>
              </a>
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/></svg>
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div className="relative xl:pl-8 xl:before:absolute xl:before:left-0 xl:before:top-6 xl:before:bottom-6 xl:before:w-px xl:before:bg-white/8 xl:before:content-['']">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Platform</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
            <ul className="mt-3 space-y-1">
              <li><Link href="/dashboard/daily-mcq" className={linkClass}>Daily MCQ</Link></li>
              <li><Link href="/dashboard/daily-answer" className={linkClass}>Daily Mains Challenge</Link></li>
              <li><Link href="/dashboard/mock-tests" className={linkClass}>Mock Tests</Link></li>
              <li><Link href="/dashboard/current-affairs" className={linkClass}>Current Affairs</Link></li>
            </ul>
          </div>

          {/* Revision Tools Column */}
          <div className="relative xl:pl-8 xl:before:absolute xl:before:left-0 xl:before:top-6 xl:before:bottom-6 xl:before:w-px xl:before:bg-white/8 xl:before:content-['']">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Revision Tools</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
            <ul className="mt-3 space-y-1">
              <li><Link href="/dashboard/flashcards" className={linkClass}>Flashcards</Link></li>
              <li><Link href="/dashboard/mindmap" className={linkClass}>Mind Maps</Link></li>
              <li><Link href="/dashboard/spaced-repetition" className={linkClass}>Spaced Repetition</Link></li>
              <li><Link href="/dashboard/study-planner" className={linkClass}>Study Planner</Link></li>
              <li><Link href="/dashboard/syllabus-tracker" className={linkClass}>Syllabus Tracker</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="relative xl:pl-8 xl:before:absolute xl:before:left-0 xl:before:top-6 xl:before:bottom-6 xl:before:w-px xl:before:bg-white/8 xl:before:content-['']">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Company</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
            <ul className="mt-3 space-y-1">
              <li><Link href="/our-story" className={linkClass}>About Us</Link></li>
              <li><Link href="/faq" className={linkClass}>FAQs</Link></li>
              <li><Link href="/terms" className={linkClass}>Terms of Use</Link></li>
              <li><Link href="/refund" className={linkClass}>Refund Policy</Link></li>
              <li><Link href="/cookies" className={linkClass}>Cookies</Link></li>
              <li><Link href="/privacy" className={linkClass}>Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div className="relative xl:pl-8 xl:before:absolute xl:before:left-0 xl:before:top-6 xl:before:bottom-6 xl:before:w-px xl:before:bg-white/8 xl:before:content-['']">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Contact Us</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Email</p>
                <a href="mailto:together@risewithjeet.com" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                  <Image src="/emm.png" alt="Email" width={16} height={16} style={{ objectFit: 'contain' }} />
                  together@risewithjeet.com
                </a>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Contact Page</p>
                <Link href="/contact" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                  <Image src="/link.png" alt="Contact" width={16} height={16} style={{ objectFit: 'contain' }} />
                  Contact Us
                </Link>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">WhatsApp</p>
                <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                  <Image src="/msggg.png" alt="WhatsApp" width={16} height={16} style={{ objectFit: 'contain' }} />
                  +91 83570 56891
                </a>
                <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/35 bg-[#25D366]/12 px-3 py-1 text-[11px] font-semibold text-[#4ADE80] hover:bg-[#25D366]/20 transition">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#4ADE80"/></svg>
                  Text on WhatsApp
                </a>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Telegram Support</p>
                <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition">
                  <Image src="/pooOO.png" alt="Telegram" width={16} height={16} style={{ objectFit: 'contain' }} />
                  @togetherrisewithjeet
                </a>
                <a href={socialLinks.telegramCommunity} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-3 py-1 text-[11px] font-semibold text-[#7DD3FC] hover:bg-[#38BDF8]/20 transition">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#7DD3FC"/></svg>
                  Join Telegram Community
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-4 text-[12px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Jeetpath Academy Private Limited. All rights reserved.</p>
          <p className="text-left sm:text-right">
            Made with <span className="text-[#F4BF4C]">&hearts;</span> for every UPSC aspirant
          </p>
        </div>
      </div>
    </footer>
  );
}
