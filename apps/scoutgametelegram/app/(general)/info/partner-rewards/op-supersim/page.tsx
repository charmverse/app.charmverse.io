import { OptimismSupersimPage } from '@packages/scoutgame-ui/components/info/partner-rewards/OptimismSupersimPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optimism Supersim Partner Rewards'
};

export default async function OptimismSupersim() {
  return <OptimismSupersimPage />;
}
