import type { MemberProperty, MemberPropertyPermission, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type SpaceSettingsExport = {
  space: Pick<Space, 'features' | 'memberProfiles'> & {
    memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[];
  };
};

export async function exportSpaceSettings({
  targetSpaceIdOrDomain
}: {
  targetSpaceIdOrDomain: string;
}): Promise<SpaceSettingsExport> {
  if (!targetSpaceIdOrDomain) {
    throw new Error('Missing targetSpaceIdOrDomain');
  }

  const isUuid = stringUtils.isUUID(targetSpaceIdOrDomain);

  const spaceWithSettings = await prisma.space.findUniqueOrThrow({
    where: {
      domain: isUuid ? undefined : targetSpaceIdOrDomain,
      id: isUuid ? targetSpaceIdOrDomain : undefined
    },
    select: {
      features: true,
      memberProfiles: true,
      memberProperties: {
        include: {
          permissions: true
        }
      }
    }
  });

  return { space: spaceWithSettings };
}
