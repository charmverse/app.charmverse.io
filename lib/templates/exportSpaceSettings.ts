import type {
  MemberProperty,
  MemberPropertyPermission,
  ProposalBlock,
  RewardBlock,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type SpaceSettingsExport = Pick<Space, 'features' | 'memberProfiles' | 'notificationToggles'> & {
  memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[];
  rewardBlocks: RewardBlock[];
  proposalBlocks: ProposalBlock[];
};

export async function exportSpaceSettings({
  spaceIdOrDomain
}: {
  spaceIdOrDomain: string;
}): Promise<{ space: SpaceSettingsExport }> {
  if (!spaceIdOrDomain) {
    throw new Error('Missing spaceIdOrDomain');
  }

  const isUuid = stringUtils.isUUID(spaceIdOrDomain);

  const spaceWithSettings = await prisma.space.findUniqueOrThrow({
    where: {
      domain: isUuid ? undefined : spaceIdOrDomain,
      id: isUuid ? spaceIdOrDomain : undefined
    },
    select: {
      features: true,
      memberProfiles: true,
      notificationToggles: true,
      memberProperties: {
        include: {
          permissions: true
        }
      },
      rewardBlocks: true,
      proposalBlocks: true
    }
  });

  return {
    space: {
      ...spaceWithSettings
    }
  };
}
