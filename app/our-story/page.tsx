import type { Metadata } from 'next';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';
import OurStoryContent from './OurStoryContent';

export const metadata: Metadata = {
  title: "About Us, RiseWithJeet | India's #1 AI-Powered UPSC Platform",
  description:
    'Built by an Aspirant, for Every Aspirant. RiseWithJeet was born from a deep love for governance, a fascination with public service, and one IIT engineer who believed every aspirant deserves a fair shot.',
};

export default function OurStoryPage() {
  return (
    <>
      <LandingNav />
      <OurStoryContent />
      <Footer />
    </>
  );
}
