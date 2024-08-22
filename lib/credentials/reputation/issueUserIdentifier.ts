import type { CharmUserCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { attestOnchain } from '../attestOnchain';
import type { EasSchemaChain } from '../connectors';
import { attestationSchemaIds } from '../schemas';

export async function issueUserIdentifierIfNecessary({
  userId,
  chainId
}: {
  userId: string;
  chainId: EasSchemaChain;
}): Promise<CharmUserCredential> {
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
    chainId,
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
      chainId,
      schemaId: attestationSchemaIds.charmUserIdentifier,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });
}
