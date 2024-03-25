// 1. Loan Officer Schema used by Financial Institution for verifying a loan officer
import type { AttestationType } from '@charmverse/core/prisma';

import type { ProposalCredential } from './proposal';
import { encodeProposalCredential, proposalCredentialSchemaId, proposalCredentialSchemaDefinition } from './proposal';
import type { RewardCredential } from './reward';
import { encodeRewardCredential, rewardCredentialSchemaId, rewardCredentialSchemaDefinition } from './reward';

export const allSchemaDefinitions = [proposalCredentialSchemaDefinition, rewardCredentialSchemaDefinition];

export const credentialLabels: Record<AttestationType, string> = {
  proposal: 'Proposal',
  reward: 'Reward'
};

export const attestationSchemaIds: Record<AttestationType, string> = {
  proposal: proposalCredentialSchemaId,
  reward: rewardCredentialSchemaId
};

export type CredentialDataInput<T extends AttestationType = AttestationType> = T extends 'proposal'
  ? ProposalCredential
  : T extends 'reward'
  ? RewardCredential
  : never;

export type CredentialData<T extends AttestationType = AttestationType> = {
  type: T;
  data: CredentialDataInput<T>;
};

export function encodeAttestation<T extends AttestationType = AttestationType>({ type, data }: CredentialData<T>) {
  if (type === 'proposal') {
    return encodeProposalCredential(data as ProposalCredential);
  } else if (type === 'reward') {
    return encodeRewardCredential(data as RewardCredential);
  }
  throw new Error(`Invalid Attestation Type: ${type}'`);
}
