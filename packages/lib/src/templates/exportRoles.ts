import type { Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpace } from 'lib/spaces/getSpace';

export type RoleExport = {
  roles: Role[];
};

export async function exportRoles({ spaceIdOrDomain }: { spaceIdOrDomain: string }) {
  const space = await getSpace(spaceIdOrDomain);

  const roles = await prisma.role.findMany({
    where: {
      spaceId: space.id
    }
  });

  return {
    roles
  };
}
