import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client'
import { registerBuilderNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderNFT';
import {starterPackBuilders} from '@packages/scoutgame/builderNfts/builderRegistration/starterPack/starterPackBuilders'
import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { getBuilderContractStarterPackMinterClient } from '@packages/scoutgame/builderNfts/clients/builderContractStarterPackMinterWriteClient';
import { builderContractStarterPackReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractStarterPackReadClient';
import { currentSeason } from '@packages/scoutgame/dates';
import { registerBuilderStarterPackNFT } from '@packages/scoutgame/builderNfts/builderRegistration/registerBuilderStarterPackNFT';
import { baseUrl } from '@packages/utils/constants';

async function deployStarterPack() {
  const builders = await prisma.scout.findMany({
    where: {

      farcasterId: { in: starterPackBuilders.map((b) => b.fid) }
    },
    select: {
      id: true,
      displayName: true,
      path: true,
      builderNfts: {
        where: {
          season: currentSeason
        }
      }
    }
  });

  for (const builder of builders) {

    await registerBuilderStarterPackNFT({
      builderId: builder.id,
      season: currentSeason,
      imageHostingBaseUrl: baseUrl
    });
  }
}
