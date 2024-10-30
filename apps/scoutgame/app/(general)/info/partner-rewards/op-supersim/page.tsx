import type { Metadata } from 'next';

import { OptimismSupersimPage } from 'components/info/partner-rewards/OptimismSupersimPage';

export const metadata: Metadata = {
  title: 'Optimism Supersim Partner Rewards'
};

export default async function OptimismSupersim() {
  return <OptimismSupersimPage />;
}
