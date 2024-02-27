import { prisma } from '@charmverse/core/prisma-client';

import { updateAllowedPlaybackDomains } from 'lib/mux/updateAllowedPlaybackDomains';
import { isValidDomainName } from 'lib/utils/domains/isValidDomainName';
import { InvalidInputError } from 'lib/utils/errors';
import { isUniqueConstraintError } from 'lib/utils/errors/prisma';

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

    // update referrers to include all custom subdomains
    await updateAllowedPlaybackDomains();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new InvalidInputError(`Custom domain ${data.customDomain} is already in use`);
    }
  }
  return data;
}
