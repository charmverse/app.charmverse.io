import { OptimismPage } from '@packages/scoutgame-ui/components/info/partner-rewards/OptimismPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optimism Partner Rewards'
};

export default async function OptimismSupersim() {
  return <OptimismPage />;
}
