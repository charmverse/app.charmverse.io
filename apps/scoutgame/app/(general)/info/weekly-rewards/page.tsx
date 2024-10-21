import type { Metadata } from 'next';

import { WeeklyRewardsPage } from 'components/info/pages/WeeklyRewardsPage';

export const metadata: Metadata = {
  title: 'WeeklyRewards'
};

export default async function WeeklyRewards() {
  return <WeeklyRewardsPage />;
}
