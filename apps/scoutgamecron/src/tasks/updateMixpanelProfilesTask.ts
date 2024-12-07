import { prisma } from '@charmverse/core/prisma-client';
import { batchUpdateMixpanelUserProfiles } from '@packages/mixpanel/updateUserProfile';
import type { MixPanelUserProfile } from '@packages/mixpanel/updateUserProfile';

const perBatch = 1000;

async function getUsers({ offset = 0 }: { offset?: number } = {}): Promise<
  { userId: string; profile: MixPanelUserProfile }[]
> {
  const scouts = await prisma.scout.findMany({
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    },
    include: {
      events: {
        where: {
          type: 'referral'
        }
      }
    }
  });
  return scouts.map((user) => ({
    userId: user.id,
    profile: {
      $name: user.displayName,
      $email: user.email,
      path: user.path!,
      onboarded: !!user.onboardedAt,
      'Agreed To TOS': !!user.agreedToTermsAt,
      'Enable Marketing': user.sendMarketing,
      'Builder Status': user.builderStatus,
      referrals: user.events.filter((e) => e.type === 'referral').length
    }
  }));
}

async function updateMixpanelUserProfiles({ offset = 0 }: { offset?: number } = {}): Promise<void> {
  const users = await getUsers({ offset });

  await batchUpdateMixpanelUserProfiles(users);

  if (users.length > 0) {
    return updateMixpanelUserProfiles({ offset: offset + perBatch });
  }
}

export async function updateMixpanelUserProfilesTask(): Promise<void> {
  await updateMixpanelUserProfiles();
}
