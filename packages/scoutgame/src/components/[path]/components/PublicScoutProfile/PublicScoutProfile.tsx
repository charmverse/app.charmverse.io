import 'server-only';

import { ErrorSSRMessage } from '../../../../components/common/ErrorSSRMessage';
import { findScoutOrThrow } from '../../../../scouts/findScoutOrThrow';
import { getScoutedBuilders } from '../../../../scouts/getScoutedBuilders';
import { getScoutStats } from '../../../../scouts/getScoutStats';
import type { BasicUserInfo } from '../../../../users/interfaces';
import { safeAwaitSSRData } from '../../../../utils/async';

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

  const [scout, { allTimePoints, seasonPoints, nftsPurchased }, scoutedBuilders] = data;

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
