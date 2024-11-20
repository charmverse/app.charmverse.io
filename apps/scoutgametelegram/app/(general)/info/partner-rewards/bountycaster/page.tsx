import { BountyCasterPage } from '@packages/scoutgame-ui/components/info/partner-rewards/BountyCasterPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BountyCaster Partner Rewards'
};

export default async function BountyCaster() {
  return <BountyCasterPage />;
}
