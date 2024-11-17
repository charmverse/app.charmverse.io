import { PointsPage } from '@packages/scoutgame-ui/components/info/pages/PointsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Points'
};

export default async function Points() {
  return <PointsPage />;
}
