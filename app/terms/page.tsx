import type { Metadata } from 'next';
import TermsContent from './TermsContent';

export const metadata: Metadata = {
  title: 'Terms & Policies | RiseWithJeet',
  description: 'Read the Terms & Policies for RiseWithJeet — India\'s #1 AI-Powered UPSC Platform.',
};

export default function TermsOfServicePage() {
  return <TermsContent />;
}
