import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { HowItWorksPage } from 'components/welcome/how-it-works/HowItWorksPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'How it works'
};

export default async function HowItWorks() {
  const user = await getUserFromSession();

  // logic in middleware.ts ensures that user is logged in
  return <HowItWorksPage username={user!.username} />;
}
