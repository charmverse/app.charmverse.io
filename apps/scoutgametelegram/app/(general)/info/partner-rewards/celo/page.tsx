import { CeloPage } from '@packages/scoutgame-ui/components/info/partner-rewards/CeloPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Celo Partner Rewards'
};

export default async function Celo() {
  return <CeloPage />;
}
