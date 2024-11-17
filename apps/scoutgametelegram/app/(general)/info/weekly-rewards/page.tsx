import { WeeklyRewardsPage } from '@packages/scoutgame-ui/components/info/pages/WeeklyRewardsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WeeklyRewards'
};

export default async function WeeklyRewards() {
  return <WeeklyRewardsPage />;
}
