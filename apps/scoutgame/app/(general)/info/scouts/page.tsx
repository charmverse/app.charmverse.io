import type { Metadata } from 'next';

import { ScoutsPage } from 'components/info/pages/ScoutsPage';

export const metadata: Metadata = {
  title: 'Scouts'
};

export default async function Scouts() {
  return <ScoutsPage />;
}
