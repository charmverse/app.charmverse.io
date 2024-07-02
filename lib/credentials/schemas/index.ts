import type { AttestationType as PrismaAttestationType } from '@charmverse/core/prisma';

import type { ExternalCredential } from './external';
import { encodeExternalCredential, externalCredentialSchemaDefinition, externalCredentialSchemaId } from './external';
import type { GitcoinProjectCredential } from './gitcoinProjectSchema';
import {
  encodeGitcoinProjectCredential,
  gitcoinProjectCredentialSchemaDefinition,
  gitcoinProjectCredentialSchemaId
} from './gitcoinProjectSchema';
import type { OptimismProjectAttestation, OptimismProjectSnapshotAttestation } from './optimismProjectSchemas';
import {
  encodeOptimismProjectAttestation,
  encodeOptimismProjectSnapshotAttestation,
  optimismProjectAttestationSchemaDefinition,
  optimismProjectAttestationSchemaId,
  optimismProjectSnapshotAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaId
} from './optimismProjectSchemas';
import type { ProposalCredential } from './proposal';
import { encodeProposalCredential, proposalCredentialSchemaId, proposalCredentialSchemaDefinition } from './proposal';
import type { RewardCredential } from './reward';
import { encodeRewardCredential, rewardCredentialSchemaId, rewardCredentialSchemaDefinition } from './reward';

export const allSchemaDefinitions = [
  proposalCredentialSchemaDefinition,
  rewardCredentialSchemaDefinition,
  externalCredentialSchemaDefinition,
  gitcoinProjectCredentialSchemaDefinition,
  optimismProjectAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaDefinition
];

export type AttestationType = PrismaAttestationType | 'gitcoinProject' | 'optimismProject' | 'optimismProjectSnapshot';

export const credentialLabels: Record<AttestationType, string> = {
  proposal: 'Proposal',
  reward: 'Reward',
  external: 'External',
  gitcoinProject: 'Gitcoin Project',
  optimismProject: 'Optimism Project',
  optimismProjectSnapshot: 'Optimism Project Snapshot'
};

export const attestationSchemaIds: Record<AttestationType, string> = {
  proposal: proposalCredentialSchemaId,
  reward: rewardCredentialSchemaId,
  external: externalCredentialSchemaId,
  gitcoinProject: gitcoinProjectCredentialSchemaId,
  optimismProject: optimismProjectAttestationSchemaId,
  optimismProjectSnapshot: optimismProjectSnapshotAttestationSchemaId
};

export const charmverseCredentialSchemas = [attestationSchemaIds.proposal, attestationSchemaIds.reward];

export type CredentialDataInput<T extends AttestationType = AttestationType> = T extends 'proposal'
  ? ProposalCredential
  : T extends 'reward'
  ? RewardCredential
  : T extends 'external'
  ? ExternalCredential
  : T extends 'gitcoinProject'
  ? GitcoinProjectCredential
  : T extends 'optimismProject'
  ? OptimismProjectAttestation
  : T extends 'optimismProjectSnapshot'
  ? OptimismProjectSnapshotAttestation
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
  } else if (type === 'external') {
    return encodeExternalCredential(data as ExternalCredential);
  } else if (type === 'gitcoinProject') {
    return encodeGitcoinProjectCredential(data as GitcoinProjectCredential);
  } else if (type === 'optimismProject') {
    return encodeOptimismProjectAttestation(data as OptimismProjectAttestation);
  } else if (type === 'optimismProjectSnapshot') {
    return encodeOptimismProjectSnapshotAttestation(data as OptimismProjectSnapshotAttestation);
  }
  throw new Error(`Invalid Attestation Type: ${type}'`);
}
