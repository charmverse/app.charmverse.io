import { InvalidInputError } from '@charmverse/core/dist/cjs/errors';
import { prisma, type SynapsCredential } from '@charmverse/core/prisma-client';

export async function upsertSynapsCredential({ spaceId, ...payload }: Omit<SynapsCredential, 'id'>) {
  if (!payload.apiKey) {
    throw new InvalidInputError('Synaps API key is required');
  }

  return prisma.synapsCredential.upsert({
    where: {
      spaceId
    },
    create: {
      spaceId,
      ...payload
    },
    update: {
      ...payload
    }
  });
}
