import type { CharmUserCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { attestOnchain } from '../attestOnchain';
import { attestationSchemaIds } from '../schemas';

import { charmCredentialChainId } from './constants';

export async function issueUserIdentifierIfNecessary({
  userId,
  chainId
}: { userId: string } & { chainId: number }): Promise<CharmUserCredential> {
  const existingIdentifier = await prisma.charmUserCredential.findFirst({
    where: {
      userId,
      chainId
    }
  });

  if (existingIdentifier) {
    return existingIdentifier;
  }

  const attestationUID = await attestOnchain({
    chainId: charmCredentialChainId,
    type: 'charmUserIdentifier',
    credentialInputs: {
      recipient: null,
      data: {
        uid: userId
      }
    }
  });

  return prisma.charmUserCredential.create({
    data: {
      attestationUID,
      chainId: charmCredentialChainId,
      schemaId: attestationSchemaIds.charmUserIdentifier,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });
}
