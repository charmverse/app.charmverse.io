import { prisma } from '@charmverse/core/prisma-client';

import { isValidDomainName } from 'lib/utilities/domains/isValidDomainName';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUniqueConstraintError } from 'lib/utilities/errors/prisma';

export type UpdateCustomDomainInput = {
  customDomain: string | null;
};

export type UpdateCustomDomainResponse = UpdateCustomDomainInput;

export async function updateSpaceCustomDomain(
  spaceId: string,
  data: UpdateCustomDomainInput
): Promise<UpdateCustomDomainResponse> {
  if (!spaceId) {
    throw new InvalidInputError('A space ID is required');
  }

  if (data.customDomain && !isValidDomainName(data.customDomain)) {
    throw new InvalidInputError('Invalid custom domain name');
  }

  try {
    await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        customDomain: data.customDomain || null
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new InvalidInputError(`Custom domain ${data.customDomain} is already in use`);
    }
  }
  return data;
}
