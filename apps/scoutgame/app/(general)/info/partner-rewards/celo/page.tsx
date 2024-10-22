import type { Metadata } from 'next';

import { CeloPage } from 'components/info/partner-rewards/CeloPage';

export const metadata: Metadata = {
  title: 'Celo Partner Rewards'
};

export default async function Celo() {
  return <CeloPage />;
}
