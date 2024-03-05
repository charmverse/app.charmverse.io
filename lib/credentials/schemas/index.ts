// 1. Loan Officer Schema used by Financial Institution for verifying a loan officer
import type { AttestationType } from '@charmverse/core/prisma';
import { optimism } from 'viem/chains';

import type { EasSchemaChain } from '../connectors';

import type { ProposalCredential } from './proposal';
import { encodeProposalCredential, optimismProposalCredentialSchemaId } from './proposal';
import type { RewardCredential } from './reward';
import { encodeRewardCredential, optimismRewardCredentialSchemaId } from './reward';

export const credentialLabels: Record<AttestationType, string> = {
  proposal: 'Proposal',
  reward: 'Reward'
};

export const attestationSchemaIds: Record<AttestationType, { [key in EasSchemaChain]: string }> = {
  proposal: {
    [optimism.id]: optimismProposalCredentialSchemaId
  },
  reward: {
    [optimism.id]: optimismRewardCredentialSchemaId
  }
};

export type CredentialData<T extends AttestationType = AttestationType> = {
  type: T;
  data: T extends 'proposal' ? ProposalCredential : T extends 'reward' ? RewardCredential : never;
};

export function getAttestationSchemaId({
  chainId,
  credentialType
}: {
  chainId: EasSchemaChain;
  credentialType: AttestationType;
}) {
  return attestationSchemaIds[credentialType][chainId];
}

export function encodeAttestion<T extends AttestationType = AttestationType>({ type, data }: CredentialData<T>) {
  if (type === 'proposal') {
    return encodeProposalCredential(data as ProposalCredential);
  } else if (type === 'reward') {
    return encodeRewardCredential(data as RewardCredential);
  }
  throw new Error(`Invalid Attestation Type: ${type}'`);
}
