import { MoxiePage } from '@packages/scoutgame-ui/components/info/partner-rewards/MoxiePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moxie Partner Rewards'
};

export default async function Moxie() {
  return <MoxiePage />;
}
