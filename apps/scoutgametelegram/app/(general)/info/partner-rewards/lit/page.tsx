import { LitProtocolPage } from '@packages/scoutgame-ui/components/info/partner-rewards/LitProtocolPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lit Protocol Partner Rewards'
};

export default async function Game7() {
  return <LitProtocolPage />;
}
