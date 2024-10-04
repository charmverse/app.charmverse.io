'use server';

import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';

import { BuildersCarousel } from './BuildersCarousel';

export async function TodaysHotBuildersCarousel({ userId }: { userId?: string }) {
  const builders = await getTodaysHotBuilders();
  return <BuildersCarousel builders={builders} userId={userId} />;
}
