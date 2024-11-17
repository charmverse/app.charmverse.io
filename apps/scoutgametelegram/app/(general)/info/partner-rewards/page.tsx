import { PartnerRewardsPage } from '@packages/scoutgame-ui/components/info/pages/PartnerRewardsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Rewards'
};

export default async function PartnerRewards() {
  return <PartnerRewardsPage />;
}
