import { AboutPage } from '@packages/scoutgame-ui/components/info/pages/AboutPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About'
};

export default async function About() {
  return <AboutPage />;
}
