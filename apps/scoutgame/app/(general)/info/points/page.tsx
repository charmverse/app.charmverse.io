import type { Metadata } from 'next';

import { PointsPage } from 'components/info/pages/PointsPage';

export const metadata: Metadata = {
  title: 'Points'
};

export default async function Points() {
  return <PointsPage />;
}
