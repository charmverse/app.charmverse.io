import 'server-only';

import { ErrorSSRMessage } from 'components/common/ErrorSSRMessage';
import { findScoutOrThrow } from 'lib/scouts/findScoutOrThrow';
import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';
import { getScoutStats } from 'lib/scouts/getScoutStats';
import type { BasicUserInfo } from 'lib/users/interfaces';
import { safeAwaitSSRData } from 'lib/utils/async';

import { PublicScoutProfileContainer } from './PublicScoutProfileContainer';

export async function PublicScoutProfile({ publicUser }: { publicUser: BasicUserInfo }) {
  const allPromises = [
    findScoutOrThrow(publicUser.id),
    getScoutStats(publicUser.id),
    getScoutedBuilders({ scoutId: publicUser.id })
  ] as const;
  const [error, data] = await safeAwaitSSRData(Promise.all(allPromises));

  if (error) {
    return <ErrorSSRMessage />;
  }

  const [scout, { allTimePoints, seasonPoints, nftsPurchased }, scoutedBuilders, user] = data;

  return (
    <PublicScoutProfileContainer
      scout={{
        ...scout,
        githubLogin: scout.githubUser[0]?.login
      }}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      nftsPurchased={nftsPurchased}
      scoutedBuilders={scoutedBuilders}
    />
  );
}
