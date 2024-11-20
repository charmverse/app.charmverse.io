import { InfoPage } from '@packages/scoutgame-ui/components/info/InfoPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Info'
};

export default async function Info() {
  return <InfoPage />;
}
