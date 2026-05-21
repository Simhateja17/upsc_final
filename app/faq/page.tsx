import type { Metadata } from 'next';
import LandingNav from '@/components/LandingNav';
import FAQContent from './FAQContent';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | RiseWithJeet',
  description: 'Find answers to common questions about RiseWithJeet – India\'s #1 AI-Powered UPSC Platform.',
};

export default function FAQPage() {
  return (
    <>
      <LandingNav />
      <FAQContent />
    </>
  );
}
