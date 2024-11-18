import { ScoutsPage } from '@packages/scoutgame-ui/components/info/pages/ScoutsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scouts'
};

export default async function Scouts() {
  return <ScoutsPage />;
}
