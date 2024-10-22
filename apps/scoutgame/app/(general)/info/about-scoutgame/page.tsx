import type { Metadata } from 'next';

import { AboutPage } from 'components/info/pages/AboutPage';

export const metadata: Metadata = {
  title: 'About'
};

export default async function About() {
  return <AboutPage />;
}
