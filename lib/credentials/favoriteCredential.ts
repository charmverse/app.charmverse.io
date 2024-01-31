import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

export type FavoriteCredentialPayload = {
  attestationId?: string;
  chainId: number;
  index: number;
  issuedCredentialId?: string;
  favorite: boolean;
};

export async function favoriteCredential({
  attestationId,
  chainId,
  index,
  issuedCredentialId,
  favorite
}: FavoriteCredentialPayload) {
  if (!attestationId && !issuedCredentialId) {
    throw new InvalidInputError(`Either Attestation ID, Chain ID or Issued Credential ID must be provided`);
  }

  if (favorite) {
    await prisma.favoriteCredential.upsert({
      where: {
        attestationId,
        issuedCredentialId
      },
      create: {
        issuedCredentialId,
        attestationId,
        chainId,
        index
      },
      update: {
        index
      }
    });
  } else {
    await prisma.favoriteCredential.delete({
      where: {
        attestationId,
        issuedCredentialId
      }
    });
  }
}
