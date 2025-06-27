import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { hasAccessToSpace } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';
import { authSecret } from '@packages/utils/constants';
import { sealData, unsealData } from 'iron-session';

type DocusignOAuthState = {
  userId: string;
  spaceId: string;
};

export async function encodeDocusignState(input: DocusignOAuthState): Promise<string> {
  if (!stringUtils.isUUID(input.spaceId) || !stringUtils.isUUID(input.userId)) {
    throw new InvalidInputError('Invalid spaceId or userId');
  }

  const sealedSpaceAndUserId = await sealData(input, { password: authSecret as string, ttl: 60 * 60 });

  return sealedSpaceAndUserId;
}

export async function decodeDocusignState(input: string): Promise<DocusignOAuthState> {
  const data = (await unsealData(input, { password: authSecret as string })) as DocusignOAuthState;

  if (!stringUtils.isUUID(data.spaceId) || !stringUtils.isUUID(data.userId)) {
    throw new InvalidInputError('Invalid spaceId or userId found in docusign data');
  }

  return data;
}
