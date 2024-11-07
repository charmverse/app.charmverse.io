import type { Metadata } from 'next';

import { OptimismPage } from 'components/info/partner-rewards/OptimismPage';

export const metadata: Metadata = {
  title: 'Optimism Partner Rewards'
};

export default async function OptimismSupersim() {
  return <OptimismPage />;
}
