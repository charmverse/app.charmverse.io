import type { Metadata } from 'next';

import { MoxiePage } from 'components/info/PartnerRewards/MoxiePage';

export const metadata: Metadata = {
  title: 'Moxie Partner Rewards'
};

export default async function Moxie() {
  return <MoxiePage />;
}