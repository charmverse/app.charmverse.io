import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

export async function getSpace(spaceIdOrDomain: string): Promise<Space> {
  if (!spaceIdOrDomain) {
    throw new InvalidInputError(`targetSpaceIdOrDomain is required`);
  }

  const isUuidValue = stringUtils.isUUID(spaceIdOrDomain);

  return prisma.space.findFirstOrThrow({
    where: {
      id: isUuidValue ? spaceIdOrDomain : undefined,
      domain: !isUuidValue ? spaceIdOrDomain : undefined
    }
  });
}
