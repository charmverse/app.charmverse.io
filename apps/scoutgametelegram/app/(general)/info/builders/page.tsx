import { BuildersPage } from '@packages/scoutgame-ui/components/info/pages/BuildersPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Builders'
};

export default async function Builders() {
  return <BuildersPage />;
}
