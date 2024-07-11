import { prisma } from '@charmverse/core/dist/cjs/prisma-client';

import { attestOnchain } from '../attestOnchain';
import { attestationSchemaIds } from '../schemas';
import { charmUserIdentifierSchemaId } from '../schemas/charmUserIdentifier';

import { charmCredentialChainId } from './constants';

export async function issueUserIdentifierIfNecessary({ userId }: { userId: string }): Promise<any> {
  const existingIdentifier = await prisma.charmCredential.findFirst({
    where: {
      type: 'user_identifier'
    }
  });

  if (existingIdentifier) {
    return existingIdentifier;
  }

  const newIdentifier = await prisma.$transaction(async (tx) => {
    const attestationUID = await attestOnchain({
      chainId: charmCredentialChainId,
      type: 'charmUserIdentifier',
      credentialInputs: {
        recipient: null,
        data: {
          uid: userId,
          metadataPtr: ''
        }
      }
    });

    return prisma.charmCredential.create({
      data: {
        type: 'user_identifier',
        attestationUID,
        chainId: charmCredentialChainId,
        qualifyingEventType: 'none',
        schemaId: attestationSchemaIds.charmUserIdentifier,
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
  });

  return newIdentifier;
}
