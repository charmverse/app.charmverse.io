import type { Metadata } from 'next';

import { LitProtocolPage } from 'components/info/partner-rewards/LitProtocolPage';

export const metadata: Metadata = {
  title: 'Lit Protocol Partner Rewards'
};

export default async function Game7() {
  return <LitProtocolPage />;
}
