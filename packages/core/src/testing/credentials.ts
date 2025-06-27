import type { CredentialEventType, CredentialTemplate, IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

type GenerateCredentialTemplateInput = Pick<CredentialTemplate, 'spaceId'> &
  Partial<
    Pick<
      CredentialTemplate,
      'name' | 'description' | 'organization' | 'schemaAddress' | 'schemaType' | 'credentialEvents'
    >
  >;

export async function generateCredentialTemplate({
  spaceId,
  description,
  name,
  organization,
  schemaAddress,
  schemaType,
  credentialEvents
}: GenerateCredentialTemplateInput): Promise<CredentialTemplate> {
  return prisma.credentialTemplate.create({
    data: {
      name: name || 'Test Credential Template',
      organization: organization || 'Test Organization',
      schemaAddress: schemaAddress || '0x20770d8c0a19668aa843240ddf6d57025334b346171c28dfed1a7ddb16928b89',
      schemaType: schemaType || 'proposal',
      description: description || 'Test Description',
      space: { connect: { id: spaceId } },
      credentialEvents
    }
  });
}

export type GenerateIssuedCredentialInput = {
  userId: string;
  proposalId?: string;
  rewardApplicationId?: string;
  credentialTemplateId: string;
  schemaId?: string;
  credentialEvent: CredentialEventType;
};

export type GenerateIssuedOnchainCredentialInput = GenerateIssuedCredentialInput & {
  onchainChainId?: number;
  onchainAttestationId?: string;
};

export async function generateIssuedOnchainCredential({
  userId,
  proposalId,
  rewardApplicationId,
  credentialEvent,
  credentialTemplateId,
  onchainAttestationId,
  onchainChainId
}: GenerateIssuedOnchainCredentialInput): Promise<IssuedCredential> {
  return prisma.issuedCredential.create({
    data: {
      credentialEvent,
      onchainChainId: onchainChainId || 10,
      onchainAttestationId: onchainAttestationId || `0x${uuid().replace(/-/g, '')}`,
      credentialTemplate: { connect: { id: credentialTemplateId } },
      proposal: proposalId ? { connect: { id: proposalId } } : undefined,
      rewardApplication: rewardApplicationId ? { connect: { id: rewardApplicationId } } : undefined,
      user: { connect: { id: userId } }
    }
  });
}
