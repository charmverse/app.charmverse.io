'use server';

import { ErrorSSRMessage } from 'components/common/ErrorSSRMessage';
import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';
import { safeAwaitSSRData } from 'lib/utils/async';

import { BuildersCarousel } from './BuildersCarousel';

export async function TodaysHotBuildersCarousel({ userId }: { userId?: string }) {
  const [error, builders] = await safeAwaitSSRData(getTodaysHotBuilders());

  if (error) {
    return <ErrorSSRMessage />;
  }

  return <BuildersCarousel builders={builders} userId={userId} />;
}
