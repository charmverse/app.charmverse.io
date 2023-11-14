import { DataNotFoundError } from '@charmverse/core/errors';
import type {
  MemberProperty,
  MemberPropertyPermission,
  MemberPropertyPermissionLevel,
  Prisma,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import { importRoles } from './importRoles';
import type { ImportParams } from './interfaces';

type SpaceImportResult = Space & { memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[] };

export async function importSpaceSettings({
  targetSpaceIdOrDomain,
  ...importParams
}: ImportParams): Promise<SpaceImportResult> {
  const { space } = await getImportData(importParams);
  if (!space) {
    throw new DataNotFoundError(`No space to import`);
  }

  const targetSpace = await getSpace(targetSpaceIdOrDomain);

  const { features, memberProfiles, memberProperties } = space;

  const { oldNewRecordIdHashMap } = await importRoles({ targetSpaceIdOrDomain, ...importParams });

  await prisma.space.update({
    where: {
      id: targetSpace.id
    },
    data: {
      features: features as Prisma.InputJsonValue[],
      memberProfiles: memberProfiles as Prisma.InputJsonValue[],
      notificationToggles: space.notificationToggles as Prisma.InputJsonValue
    }
  });

  const propertiesToCreate: (Prisma.MemberPropertyCreateManyInput & { permissions: MemberPropertyPermission[] })[] =
    memberProperties.map((prop) => {
      return {
        ...prop,
        options: prop.options as Prisma.InputJsonValue[],
        id: uuid(),
        spaceId: targetSpace.id,
        createdBy: targetSpace.createdBy,
        updatedBy: targetSpace.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

  const permissionsToCreate: Prisma.MemberPropertyPermissionCreateManyInput[] = propertiesToCreate.flatMap((prop) => {
    return prop.permissions
      .map((perm) => {
        return {
          memberPropertyId: prop.id,
          memberPropertyPermissionLevel: perm.memberPropertyPermissionLevel as MemberPropertyPermissionLevel,
          roleId: perm.roleId ? oldNewRecordIdHashMap[perm.roleId] : undefined
        } as Prisma.MemberPropertyPermissionCreateManyInput;
      })
      .filter((perm) => !!perm.roleId);
  });

  await prisma.$transaction([
    prisma.memberProperty.createMany({
      data: propertiesToCreate.map(({ permissions, ...prop }) => prop)
    }),
    prisma.memberPropertyPermission.createMany({
      data: permissionsToCreate
    })
  ]);

  return prisma.space.findUniqueOrThrow({
    where: {
      id: targetSpace.id
    },
    include: {
      memberProperties: {
        include: {
          permissions: true
        }
      }
    }
  });
}
