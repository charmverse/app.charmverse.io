import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { batchUpdateMixpanelUserProfiles, type MixPanelUserProfile } from '@packages/mixpanel/updateUserProfile';

const perBatch = 1000;

function getMixpanelUserProfile(user: Scout): MixPanelUserProfile {
  return {
    $name: user.displayName,
    $email: user.email,
    username: user.username,
    onboarded: !!user.onboardedAt,
    'Agreed To TOS': !!user.agreedToTermsAt,
    'Enable Marketing': user.sendMarketing,
    'Builder Status': user.builderStatus
  };
}

async function updateMixpanelUserProfiles({ offset = 0 }: { offset?: number } = {}): Promise<void> {
  const users = await prisma.scout.findMany({
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    }
  });

  await batchUpdateMixpanelUserProfiles(
    users.map((user) => ({ userId: user.id, profile: getMixpanelUserProfile(user) }))
  );

  if (users.length > 0) {
    return updateMixpanelUserProfiles({ offset: offset + perBatch });
  }
}

export async function updateMixpanelUserProfilesTask(): Promise<void> {
  await updateMixpanelUserProfiles();
}
