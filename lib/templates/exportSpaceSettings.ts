import type { MemberProperty, MemberPropertyPermission, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type SpaceSettingsExport = Pick<Space, 'features' | 'memberProfiles'> & {
  memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[];
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
      memberProperties: {
        include: {
          permissions: true
        }
      }
    }
  });

  return { space: spaceWithSettings };
}
