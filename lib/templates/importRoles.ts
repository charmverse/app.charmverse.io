import type { Prisma, Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import type { ImportParams, OldNewIdHashMap } from './interfaces';

type RoleImportResult = OldNewIdHashMap & { roles: Role[] };

export async function importRoles({ targetSpaceIdOrDomain, ...importParams }: ImportParams): Promise<RoleImportResult> {
  const { roles } = await getImportData(importParams);

  if (!roles?.length) {
    return { oldNewRecordIdHashMap: {}, roles: [] };
  }

  const targetSpace = await getSpace(targetSpaceIdOrDomain);

  const targetSpaceRoles = await prisma.role.findMany({
    where: {
      spaceId: targetSpace.id,
      name: {
        in: roles.map((r) => r.name)
      }
    }
  });

  const hashmap: OldNewIdHashMap = {
    oldNewRecordIdHashMap: {}
  };

  const { rolesToCreate, existing } = roles.reduce(
    (acc, roleToCopy) => {
      const existingMatchingRole = targetSpaceRoles.find((r) => r.name === roleToCopy.name);

      if (!existingMatchingRole) {
        const createInput: Prisma.RoleCreateInput = {
          id: uuid(),
          createdBy: targetSpace.createdBy,
          name: roleToCopy.name,
          space: { connect: { id: targetSpace.id } }
        };

        hashmap.oldNewRecordIdHashMap[roleToCopy.id] = createInput.id as string;

        acc.rolesToCreate.push({
          sourceRoleId: roleToCopy.id,
          targetSpaceRoleCreateData: createInput
        });
      } else {
        acc.existing.push({ sourceRoleId: roleToCopy.id, targetSpaceRole: existingMatchingRole });

        hashmap.oldNewRecordIdHashMap[roleToCopy.id] = existingMatchingRole.id;
      }
      return acc;
    },
    { existing: [], rolesToCreate: [] } as {
      existing: { sourceRoleId: string; targetSpaceRole: Role }[];
      rolesToCreate: { sourceRoleId: string; targetSpaceRoleCreateData: Prisma.RoleCreateInput }[];
    }
  );
  const newlyAddedRoles = await prisma.$transaction(
    rolesToCreate.map((r) => prisma.role.create({ data: r.targetSpaceRoleCreateData }))
  );

  const allRoles = [...newlyAddedRoles, ...existing.map((r) => r.targetSpaceRole)];

  return {
    ...hashmap,
    roles
  };
}
