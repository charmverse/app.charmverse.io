import 'server-only';

import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';

import { BuildersCarousel } from './BuildersCarousel';

export async function TodaysHotBuildersCarousel() {
  const builders = await getTodaysHotBuilders();

  return <BuildersCarousel builders={builders} />;
}
