import type { Metadata } from 'next';

import { TalentProtocolPage } from 'components/info/partner-rewards/TalentProtocolPage';

export const metadata: Metadata = {
  title: 'Talent Protocol Partner Rewards'
};

export default async function TalentProtocol() {
  return <TalentProtocolPage />;
}
