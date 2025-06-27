import type {
  MemberProperty,
  MemberPropertyPermission,
  ProposalBlock,
  ProposalWorkflow,
  RewardBlock,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@packages/core/utilities';

export type SpaceSettingsExport = Pick<
  Space,
  | 'features'
  | 'memberProfiles'
  | 'notificationToggles'
  | 'defaultPagePermissionGroup'
  | 'hiddenFeatures'
  | 'requireProposalTemplate'
  | 'publicBountyBoard'
  | 'publicProposals'
  | 'defaultPublicPages'
> & {
  memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[];
  rewardBlocks: RewardBlock[];
  proposalBlocks: ProposalBlock[];
  proposalWorkflows: ProposalWorkflow[];
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
      defaultPagePermissionGroup: true,
      hiddenFeatures: true,
      requireProposalTemplate: true,
      publicBountyBoard: true,
      publicProposals: true,
      defaultPublicPages: true,
      memberProperties: {
        include: {
          permissions: true
        }
      },
      rewardBlocks: true,
      proposalBlocks: true,
      proposalWorkflows: true
    }
  });

  return {
    space: {
      ...spaceWithSettings
    }
  };
}
