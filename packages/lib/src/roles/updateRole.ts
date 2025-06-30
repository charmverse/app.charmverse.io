import type { Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

type UpdateableRoleFields = Partial<Pick<Role, 'name'>>;

export async function updateRole({ id, update }: { id: string; update: UpdateableRoleFields }): Promise<Role> {
  if (!stringUtils.isUUID(id)) {
    throw new InvalidInputError('Please provide a valid role id');
  }

  const existingRole = await prisma.role.findUnique({
    where: {
      id
    },
    select: {
      source: true
    }
  });

  if (!existingRole) {
    throw new DataNotFoundError(`Could not find role with id ${id}`);
  }

  if (existingRole.source === 'guild_xyz') {
    throw new UndesirableOperationError('Cannot update role imported from guild.xyz');
  }

  const updatedRole = await prisma.role.update({
    where: {
      id
    },
    data: {
      name: update.name
    }
  });

  return updatedRole;
}
