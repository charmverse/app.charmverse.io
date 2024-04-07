import { InvalidInputError } from '@charmverse/core/errors';
import {
  prisma,
  type AttestationType,
  type CredentialEventType,
  type IssuedCredential
} from '@charmverse/core/prisma-client';

type NonNullableValues<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * The unique combination of data that defines a credential
 */
export type IdenticalCredentialProps = {
  credentialTemplateId: string;
  userId: string;
  credentialEvent: CredentialEventType;
  schemaId: string;
  proposalId?: string;
  rewardApplicationId?: string;
};

type IssuedCredentialToSave = {
  credentialProps: IdenticalCredentialProps;
  offchainData?: NonNullableValues<Pick<IssuedCredential, 'ceramicId' | 'ceramicRecord'>>;
  onChainData?: NonNullableValues<Pick<IssuedCredential, 'onchainChainId' | 'onchainAttestationId'>>;
};

export async function saveIssuedCredential({
  credentialProps: { credentialEvent, credentialTemplateId, schemaId, userId, proposalId, rewardApplicationId },
  offchainData,
  onChainData
}: IssuedCredentialToSave): Promise<IssuedCredential> {
  if ((!proposalId && !rewardApplicationId) || (proposalId && rewardApplicationId)) {
    throw new InvalidInputError('Either proposalId or rewardApplicationId must be provided');
  }
  if (!offchainData && !onChainData) {
    throw new InvalidInputError('Either offchainData or onChainData must be provided');
  }

  const existingCredential = await prisma.issuedCredential.findFirst({
    where: {
      credentialTemplateId,
      userId,
      credentialEvent,
      // One of these will be undefined
      proposalId,
      rewardApplicationId
    }
  });

  let returnedCredential = existingCredential;

  if (existingCredential) {
    returnedCredential = await prisma.issuedCredential.update({
      where: { id: existingCredential.id },
      data: {
        onchainChainId: onChainData?.onchainChainId,
        onchainAttestationId: onChainData?.onchainAttestationId,
        ceramicId: offchainData?.ceramicId,
        ceramicRecord: offchainData?.ceramicRecord
      }
    });
  } else {
    returnedCredential = await prisma.issuedCredential.create({
      data: {
        credentialEvent,
        credentialTemplate: { connect: { id: credentialTemplateId } },
        user: { connect: { id: userId } },
        schemaId,
        onchainChainId: onChainData?.onchainChainId,
        onchainAttestationId: onChainData?.onchainAttestationId,
        ceramicId: offchainData?.ceramicId,
        ceramicRecord: offchainData?.ceramicRecord,
        proposal: proposalId ? { connect: { id: proposalId } } : undefined,
        rewardApplication: rewardApplicationId ? { connect: { id: rewardApplicationId } } : undefined
      }
    });
  }

  return returnedCredential;
}
