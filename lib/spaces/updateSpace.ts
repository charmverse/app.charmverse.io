import type { MemberPropertyType, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { getSpaceDomainFromName } from 'lib/spaces/utils';
import { DuplicateDataError, InvalidInputError } from 'lib/utilities/errors';

export type UpdateableSpaceFields = Partial<
  Pick<
    Space,
    | 'hiddenFeatures'
    | 'domain'
    | 'name'
    | 'spaceImage'
    | 'spaceArtwork'
    | 'features'
    | 'memberProfiles'
    | 'notificationToggles'
    | 'primaryMemberIdentity'
  >
>;

export async function updateSpace(spaceId: string, updates: UpdateableSpaceFields): Promise<Space> {
  if (!spaceId) {
    throw new InvalidInputError('A space ID is required');
  }

  const domain = updates?.domain ? getSpaceDomainFromName(updates?.domain) : undefined;

  if (domain) {
    const existingSpace = await getSpaceByDomain(domain);

    if (existingSpace && existingSpace.id !== spaceId) {
      throw new DuplicateDataError(`A space with the domain ${domain} already exists`);
    }
  } else if (typeof domain !== 'undefined') {
    throw new InvalidInputError('Domain cannot be empty');
  }

  const primaryMemberIdentity = updates?.primaryMemberIdentity?.toLocaleLowerCase() ?? '';

  if (['google', 'wallet', 'telegram', 'discord'].includes(primaryMemberIdentity)) {
    await prisma.$transaction([
      prisma.memberProperty.updateMany({
        where: {
          spaceId,
          type: primaryMemberIdentity as MemberPropertyType
        },
        data: {
          required: true
        }
      })
    ]);
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      domain,
      name: updates.name,
      spaceImage: updates.spaceImage,
      spaceArtwork: updates.spaceArtwork,
      hiddenFeatures: updates.hiddenFeatures,
      notificationToggles: updates.notificationToggles as any,
      features: updates.features as any,
      memberProfiles: updates.memberProfiles as any,
      primaryMemberIdentity: updates.primaryMemberIdentity
    }
  });

  updateTrackGroupProfile(updatedSpace);

  return updatedSpace;
}
