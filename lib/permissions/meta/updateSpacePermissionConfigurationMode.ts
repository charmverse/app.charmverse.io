import type { Space, SpaceOperation } from '@charmverse/core/prisma';
import { SpacePermissionConfigurationMode } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';

import { addSpaceOperations, removeSpaceOperations } from '../spaces';

import type { SpacePermissionConfigurationUpdate } from './interfaces';
import { permissionTemplates } from './preset-templates';

export async function updateSpacePermissionConfigurationMode({
  permissionConfigurationMode,
  spaceId
}: SpacePermissionConfigurationUpdate): Promise<Space> {
  if (!SpacePermissionConfigurationMode[permissionConfigurationMode]) {
    throw new InvalidInputError(
      `Please provide a valid configuration mode from "${Object.keys(SpacePermissionConfigurationMode)}"`
    );
  }

  let space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  const updatedDefaults =
    permissionConfigurationMode === 'custom'
      ? {}
      : permissionTemplates[permissionConfigurationMode].pagePermissionDefaults;

  space = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      permissionConfigurationMode,
      ...updatedDefaults
    }
  });

  if (permissionConfigurationMode !== 'custom') {
    const template = permissionTemplates[permissionConfigurationMode];

    const toAdd: SpaceOperation[] = (Object.entries(template.spaceOperations) as [SpaceOperation, boolean][])
      .filter(([op, value]) => value === true)
      .map((tuple) => tuple[0]);

    if (toAdd.length > 0) {
      await addSpaceOperations({
        forSpaceId: spaceId,
        spaceId,
        operations: toAdd
      });
    }
    const toRemove: SpaceOperation[] = (Object.entries(template.spaceOperations) as [SpaceOperation, boolean][])
      .filter(([op, value]) => value === false)
      .map((tuple) => tuple[0]);

    if (toRemove.length > 0) {
      await removeSpaceOperations({
        forSpaceId: spaceId,
        spaceId,
        operations: toRemove
      });
    }
  }

  return space;
}
