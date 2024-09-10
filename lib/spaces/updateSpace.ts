import { log } from '@charmverse/core/log';
import type { MemberPropertyType, Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { updateTrackGroupProfile } from '@root/lib/metrics/mixpanel/updateTrackGroupProfile';
import { getSpaceByDomain } from '@root/lib/spaces/getSpaceByDomain';
import { getSpaceDomainFromName } from '@root/lib/spaces/utils';
import { updateCustomerStripeInfo } from '@root/lib/subscription/updateCustomerStripeInfo';
import { DataNotFoundError, DuplicateDataError, InvalidInputError } from '@root/lib/utils/errors';

import { updateSnapshotDomain } from './updateSnapshotDomain';
import { updateSpaceCustomDomain } from './updateSpaceCustomDomain';

export type UpdateableSpaceFields = Partial<
  Pick<
    Space,
    | 'hiddenFeatures'
    | 'homePageId'
    | 'domain'
    | 'name'
    | 'spaceImage'
    | 'spaceArtwork'
    | 'features'
    | 'memberProfiles'
    | 'notificationToggles'
    | 'primaryMemberIdentity'
    | 'requireMembersTwoFactorAuth'
    | 'credentialLogo'
    | 'customDomain'
    | 'snapshotDomain'
    | 'enableTestnets'
    | 'useOnchainCredentials'
    | 'credentialsChainId'
    | 'credentialsWallet'
    | 'kycOption'
    | 'emailBrandArtwork'
    | 'emailBrandColor'
    | 'tokenGateMessage'
  >
>;

export async function updateSpace(spaceId: string, updates: UpdateableSpaceFields): Promise<Space> {
  if (!spaceId) {
    throw new InvalidInputError('A space ID is required');
  }

  const existingSpace = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      domain: true,
      customDomain: true,
      snapshotDomain: true,
      primaryMemberIdentity: true
    }
  });

  if (!existingSpace) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  const domain = updates.domain ? getSpaceDomainFromName(updates.domain) : undefined;

  if (domain) {
    const existingDomainSpace = await getSpaceByDomain(domain);

    if (existingDomainSpace && existingDomainSpace.id !== spaceId) {
      throw new DuplicateDataError(`A space with the domain ${domain} already exists`);
    }
  } else if (typeof domain !== 'undefined') {
    throw new InvalidInputError('Domain cannot be empty');
  }

  if (updates.customDomain !== undefined && updates.customDomain !== existingSpace.customDomain) {
    await updateSpaceCustomDomain(spaceId, { customDomain: updates.customDomain });
  }

  if (updates.snapshotDomain !== undefined && updates.snapshotDomain !== existingSpace.snapshotDomain) {
    await updateSnapshotDomain(spaceId, updates.snapshotDomain);
  }

  const primaryMemberIdentity = updates?.primaryMemberIdentity?.toLocaleLowerCase() ?? '';
  const existingPrimaryMemberIdentity = existingSpace.primaryMemberIdentity?.toLocaleLowerCase() ?? '';
  const prismaPromises: Prisma.PrismaPromise<Prisma.BatchPayload>[] = existingPrimaryMemberIdentity
    ? [
        prisma.memberProperty.updateMany({
          where: {
            spaceId,
            type: existingPrimaryMemberIdentity as MemberPropertyType
          },
          data: {
            required: false
          }
        })
      ]
    : [];

  if (['google', 'wallet', 'telegram', 'discord'].includes(primaryMemberIdentity)) {
    prismaPromises.push(
      prisma.memberProperty.updateMany({
        where: {
          spaceId,
          type: primaryMemberIdentity as MemberPropertyType
        },
        data: {
          required: true
        }
      })
    );
  }

  if (prismaPromises.length) {
    await prisma.$transaction(prismaPromises);
  }

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      domain,
      homePageId: updates.homePageId,
      name: updates.name,
      spaceImage: updates.spaceImage,
      spaceArtwork: updates.spaceArtwork,
      hiddenFeatures: updates.hiddenFeatures,
      notificationToggles: updates.notificationToggles as any,
      features: updates.features as any,
      memberProfiles: updates.memberProfiles as any,
      primaryMemberIdentity: updates.primaryMemberIdentity,
      enableTestnets: updates.enableTestnets,
      requireMembersTwoFactorAuth: updates.requireMembersTwoFactorAuth,
      credentialLogo: updates.credentialLogo,
      useOnchainCredentials: updates.useOnchainCredentials,
      credentialsChainId: updates.credentialsChainId,
      credentialsWallet: updates.credentialsWallet?.toLowerCase(),
      kycOption: updates.kycOption,
      emailBrandArtwork: updates.emailBrandArtwork,
      tokenGateMessage: updates.tokenGateMessage as any,
      emailBrandColor: updates.emailBrandColor
        ? updates.emailBrandColor.includes('#')
          ? updates.emailBrandColor
          : `#${updates.emailBrandColor}`
        : undefined
    }
  });

  await updateTrackGroupProfile(updatedSpace);

  if (updatedSpace.domain !== existingSpace.domain) {
    try {
      await updateCustomerStripeInfo({
        spaceId,
        update: {
          metadata: {
            domain: updatedSpace.domain
          }
        }
      });
    } catch (err) {
      log.error(`Error updating stripe customer details`, { spaceId, err });
    }
  }

  return updatedSpace;
}
