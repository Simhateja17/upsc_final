'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCmsContent } from '@/hooks/useCmsContent';

type FooterLinkGroups = {
  platform: string[];
  revision_tools: string[];
  company: string[];
};

type FooterContactInfo = {
  email: string;
  whatsapp: string;
  whatsapp_link: string;
  telegram_handle: string;
  telegram_link: string;
  google_play_link: string;
  app_store_link: string;
  youtube_link: string;
  instagram_link: string;
  x_link: string;
  facebook_link: string;
  linkedin_link: string;
};

const defaultFooterLinks: FooterLinkGroups = {
  platform: ['Daily MCQ', 'Daily Mains Challenge', 'Mock Tests', 'Current Affairs'],
  revision_tools: ['Flashcards', 'Mind Maps', 'Spaced Repetition', 'Study Planner', 'Syllabus Tracker'],
  company: ['About Us', 'FAQs', 'Terms of Use', 'Refund Policy', 'Cookies', 'Privacy Policy'],
};

const defaultContactInfo: FooterContactInfo = {
  email: 'together@risewithjeet.com',
  whatsapp: '+91 83570 56891',
  whatsapp_link: 'https://wa.me/918357056891',
  telegram_handle: '@togetherrisewithjeet',
  telegram_link: 'https://t.me/togetherrisewithjeet',
  google_play_link: '#',
  app_store_link: '#',
  youtube_link: '#',
  instagram_link: '#',
  x_link: '#',
  facebook_link: '#',
  linkedin_link: '#',
};

const defaults = {
  footer_description:
    "Rise With Jeet is redefining UPSC preparation with a simplified, smarter approach. As India's leading AI-powered platform, we combine cutting-edge technology, high-quality content, expert guidance, and innovative tools to deliver an effective learning experience.",
  footer_links: defaultFooterLinks,
  footer_contact_info: defaultContactInfo,
};

const platformRouteMap: Record<string, string> = {
  'Daily MCQ': '/dashboard/daily-mcq',
  'Daily Mains Challenge': '/dashboard/daily-answer',
  'Mock Tests': '/dashboard/mock-tests',
  'Current Affairs': '/dashboard/current-affairs',
};

const revisionRouteMap: Record<string, string> = {
  Flashcards: '/dashboard/flashcards',
  'Mind Maps': '/dashboard/mindmap',
  'Spaced Repetition': '/dashboard/spaced-repetition',
  'Study Planner': '/dashboard/study-planner',
  'Syllabus Tracker': '/dashboard/syllabus-tracker',
};

const companyRouteMap: Record<string, string> = {
  'About Us': '/our-story',
  FAQs: '/faq',
  'Terms of Use': '/terms',
  'Refund Policy': '/refund',
  Cookies: '/cookies',
  'Privacy Policy': '/privacy',
};

function normalizeFooterLinks(raw: unknown): FooterLinkGroups {
  if (!raw || typeof raw !== 'object') {
    return defaultFooterLinks;
  }

  const source = raw as Record<string, unknown>;
  const platform = Array.isArray(source.platform)
    ? (source.platform as string[])
    : Array.isArray(source.courses)
      ? (source.courses as string[])
      : defaultFooterLinks.platform;
  const revision_tools = Array.isArray(source.revision_tools)
    ? (source.revision_tools as string[])
    : Array.isArray(source.support)
      ? (source.support as string[])
      : defaultFooterLinks.revision_tools;
  const company = Array.isArray(source.company) ? (source.company as string[]) : defaultFooterLinks.company;

  return { platform, revision_tools, company };
}

function linkClassName() {
  return 'inline-flex items-center py-1 text-[rgba(255,255,255,0.56)] text-[28px] leading-[1.25] font-plus-jakarta transition hover:text-white';
}

export default function Footer() {
  const { get } = useCmsContent('home', defaults);
  const cmsLinks = normalizeFooterLinks(get('footer_links', defaultFooterLinks));
  const contactInfo = { ...defaultContactInfo, ...(get('footer_contact_info', defaultContactInfo) as Partial<FooterContactInfo>) };
  const description = get('footer_description', defaults.footer_description) as string;

  return (
    <footer className="w-full border-t border-[#F4BF4C]/70 bg-[#000E2D]">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 py-10 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] xl:gap-0">
          <div className="pr-0 xl:pr-8">
            <Image src="/footer-logo.png" alt="RiseWithJeet" width={205} height={80} className="h-auto w-[205px]" />
            <p className="mt-4 max-w-[320px] text-[37px] leading-[1.45] text-[rgba(255,255,255,0.56)]">{description}</p>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.38)]">Download the app</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={contactInfo.google_play_link} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[14px] font-semibold text-white hover:bg-white/10">
                Google Play
              </a>
              <a href={contactInfo.app_store_link} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[14px] font-semibold text-white hover:bg-white/10">
                App Store
              </a>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.38)]">Follow us</p>
            <div className="mt-3 flex items-center gap-2">
              <a href={contactInfo.youtube_link} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10">YT</a>
              <a href={contactInfo.instagram_link} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10">IG</a>
              <a href={contactInfo.whatsapp_link} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10">WA</a>
              <a href={contactInfo.x_link} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10">X</a>
              <a href={contactInfo.facebook_link} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10">FB</a>
              <a href={contactInfo.linkedin_link} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10">IN</a>
            </div>
          </div>

          <div className="xl:border-l xl:border-white/10 xl:pl-8">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Platform</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
            <ul className="mt-3 space-y-1">
              {cmsLinks.platform.map((item) => (
                <li key={item}>
                  <Link href={platformRouteMap[item] || '#'} className={linkClassName()}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="xl:border-l xl:border-white/10 xl:pl-8">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Revision Tools</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
            <ul className="mt-3 space-y-1">
              {cmsLinks.revision_tools.map((item) => (
                <li key={item}>
                  <Link href={revisionRouteMap[item] || '#'} className={linkClassName()}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="xl:border-l xl:border-white/10 xl:pl-8">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Company</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />
            <ul className="mt-3 space-y-1">
              {cmsLinks.company.map((item) => (
                <li key={item}>
                  <Link href={companyRouteMap[item] || '#'} className={linkClassName()}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="xl:border-l xl:border-white/10 xl:pl-8">
            <h3 className="pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white">Contact Us</h3>
            <div className="h-[2px] w-7 rounded bg-[#F4BF4C]" />

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)]">Email</p>
                <a href={`mailto:${contactInfo.email}`} className="mt-1 block text-[22px] leading-tight text-[rgba(255,255,255,0.85)] hover:text-white">
                  {contactInfo.email}
                </a>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)]">Contact Page</p>
                <Link href="/contact" className="mt-1 block text-[22px] leading-tight text-[rgba(255,255,255,0.85)] hover:text-white">
                  Contact Us
                </Link>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)]">WhatsApp</p>
                <a href={contactInfo.whatsapp_link} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[22px] leading-tight text-[rgba(255,255,255,0.85)] hover:text-white">
                  {contactInfo.whatsapp}
                </a>
                <a href={contactInfo.whatsapp_link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center rounded-full border border-[#25D366]/35 bg-[#25D366]/12 px-3 py-1 text-[12px] font-semibold text-[#4ADE80] hover:bg-[#25D366]/20">
                  Text on WhatsApp
                </a>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)]">Telegram Support</p>
                <a href={contactInfo.telegram_link} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[22px] leading-tight text-[rgba(255,255,255,0.85)] hover:text-white">
                  {contactInfo.telegram_handle}
                </a>
                <a href={contactInfo.telegram_link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-3 py-1 text-[12px] font-semibold text-[#7DD3FC] hover:bg-[#38BDF8]/20">
                  Join Telegram Community
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-4 text-[22px] text-[rgba(255,255,255,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Jeetpath Academy Private Limited. All rights reserved.</p>
          <p className="text-left sm:text-right">
            Made with <span className="text-[#F4BF4C]">♥</span> for every UPSC aspirant
          </p>
        </div>
      </div>
    </footer>
  );
}
