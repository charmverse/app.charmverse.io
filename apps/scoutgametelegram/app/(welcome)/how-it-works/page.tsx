import type { Metadata } from 'next';
import React from 'react';

import { HowItWorksPage } from 'components/welcome/how-it-works/HowItWorksPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'How it works'
};

export default async function HowItWorks() {
  // logic in middleware.ts ensures that user is logged in
  return <HowItWorksPage />;
}
