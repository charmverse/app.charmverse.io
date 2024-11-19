import { TalentProtocolPage } from '@packages/scoutgame-ui/components/info/partner-rewards/TalentProtocolPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talent Protocol Partner Rewards'
};

export default async function TalentProtocol() {
  return <TalentProtocolPage />;
}
