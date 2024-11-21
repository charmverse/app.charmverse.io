import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { updateMoxieProfile, updateTalentProfile } from './updateTalentMoxieProfile';

export async function updateTalentMoxieProfiles() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
      farcasterId: true,
      id: true,
      scoutWallet: {
        select: {
          address: true
        }
      }
    }
  });

  for (const builder of builders) {
    try {
      await updateTalentProfile({
        builderId: builder.id,
        farcasterId: builder.farcasterId,
        wallets: builder.scoutWallet.map((wallet) => wallet.address)
      });
    } catch (error) {
      log.error('Error updating talent profile', { builderId: builder.id, error });
    }
    if (builder.farcasterId) {
      try {
        await updateMoxieProfile({ farcasterId: builder.farcasterId, builderId: builder.id });
      } catch (error) {
        log.error('Error updating moxie profile', { builderId: builder.id, error });
      }
    }
  }
}
