import type { RoleSource } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';

export async function createRole({
  name,
  spaceId,
  createdBy,
  externalId,
  source
}: {
  name?: string;
  spaceId: string;
  createdBy?: string;
  externalId?: string;
  source?: RoleSource;
}) {
  return prisma.role.create({
    data: {
      space: { connect: { id: spaceId } },
      name: name || v4(),
      createdBy: createdBy || v4(),
      source,
      externalId
    }
  });
}
