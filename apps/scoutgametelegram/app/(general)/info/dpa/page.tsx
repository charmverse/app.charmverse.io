import { DataProcessingPage } from '@packages/scoutgame-ui/components/info/dpa/DataProcessingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Addendum'
};

export default async function Info() {
  return <DataProcessingPage />;
}
