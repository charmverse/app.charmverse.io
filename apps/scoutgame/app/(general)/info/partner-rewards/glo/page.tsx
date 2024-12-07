import { GloDollarPage } from '@packages/scoutgame-ui/components/info/partner-rewards/GloDollarPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Glo Rewards'
};

export default async function Game7() {
  return <GloDollarPage />;
}
