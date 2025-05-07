import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import { isUniqueConstraintError } from '@packages/utils/errors/prisma';
import { updateAllowedPlaybackDomains } from '@packages/lib/mux/updateAllowedPlaybackDomains';
import { isValidDomainName } from '@packages/lib/utils/domains/isValidDomainName';

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
    try {
      await updateAllowedPlaybackDomains();
    } catch (error) {
      log.error('Failed to update video playback referrers on Mux', { spaceId, error });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new InvalidInputError(`Custom domain ${data.customDomain} is already in use`);
    }
    log.warn('Error updating custom domain for space', { spaceId, error });
  }
  return data;
}
