import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SpamPolicyPage } from 'components/welcome/spam-policy/SpamPolicyPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Spam policy'
};

export default async function SpamPolicy() {
  return <SpamPolicyPage />;
}
