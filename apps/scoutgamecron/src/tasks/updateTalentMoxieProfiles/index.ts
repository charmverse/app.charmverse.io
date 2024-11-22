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
      talentProfile: {
        select: {
          address: true
        }
      },
      farcasterId: true,
      id: true,
      scoutWallet: {
        select: {
          address: true
        }
      }
    }
  });

  log.info(`Updating talent & moxie profiles for ${builders.length} builders`);

  let updatedTalentProfiles = 0;
  let updatedMoxieProfiles = 0;

  for (const builder of builders) {
    try {
      await updateTalentProfile({
        builderId: builder.id,
        farcasterId: builder.farcasterId,
        // If the builder has a talent profile, use the wallet address, otherwise use the scout wallet
        wallets: builder.talentProfile
          ? [builder.talentProfile.address]
          : builder.scoutWallet.map((wallet) => wallet.address)
      });
      updatedTalentProfiles += 1;
    } catch (error) {
      log.error('Error updating talent profile', { builderId: builder.id, error });
    }
    if (builder.farcasterId) {
      try {
        await updateMoxieProfile({ farcasterId: builder.farcasterId, builderId: builder.id });
        updatedMoxieProfiles += 1;
      } catch (error) {
        log.error('Error updating moxie profile', { builderId: builder.id, error });
      }
    }
  }

  log.info(`Updated profiles`, {
    totalBuilders: builders.length,
    updatedTalentProfiles,
    updatedMoxieProfiles
  });
}
