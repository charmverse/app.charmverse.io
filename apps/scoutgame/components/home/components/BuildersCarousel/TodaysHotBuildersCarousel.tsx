import 'server-only';

import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { BuildersCarousel } from './BuildersCarousel';

export async function TodaysHotBuildersCarousel() {
  const builders = await getTodaysHotBuilders({ limit: 10 });

  const user = await getUserFromSession();

  return <BuildersCarousel builders={builders} user={user} />;
}
