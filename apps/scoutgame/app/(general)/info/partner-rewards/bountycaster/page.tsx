import type { Metadata } from 'next';

import { BountyCasterPage } from 'components/info/pages/PartnerRewards/BountyCasterPage';

export const metadata: Metadata = {
  title: 'BountyCaster Partner Rewards'
};

export default async function BountyCaster() {
  return <BountyCasterPage />;
}
