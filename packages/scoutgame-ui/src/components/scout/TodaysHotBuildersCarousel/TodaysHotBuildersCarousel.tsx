import 'server-only';

import { getTodaysHotBuilders } from '@packages/scoutgame/builders/getTodaysHotBuilders';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { ErrorSSRMessage } from '../../common/ErrorSSRMessage';

import { BuildersCarousel } from './BuildersCarousel';

export async function TodaysHotBuildersCarousel({ showPromoCards = false }: { showPromoCards?: boolean }) {
  const [error, builders] = await safeAwaitSSRData(getTodaysHotBuilders());
  if (error) {
    return <ErrorSSRMessage />;
  }

  return <BuildersCarousel builders={builders} showPromoCards={showPromoCards} />;
}
