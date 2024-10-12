import type { Metadata } from 'next';

import { CeloPage } from 'components/info/PartnerRewards/CeloPage';

export const metadata: Metadata = {
  title: 'Celo Partner Rewards'
};

export default async function Celo() {
  return <CeloPage />;
}
