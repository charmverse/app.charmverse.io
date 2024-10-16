import type { Metadata } from 'next';

import { PartnerRewardsPage } from 'components/info/pages/PartnerRewardsPage';

export const metadata: Metadata = {
  title: 'Partner Rewards'
};

export default async function PartnerRewards() {
  return <PartnerRewardsPage />;
}
