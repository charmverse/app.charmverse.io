import type { AttestationType as PrismaAttestationType } from '@charmverse/core/prisma';

import { charmProjectSchemaId, encodeCharmProject, type CharmProject } from './charmProject';
import {
  charmProjectMetadataSchemaId,
  encodeCharmProjectMetadata,
  type CharmProjectMetadata
} from './charmProjectMetadata';
import type { CharmQualifyingEvent } from './charmQualifyingEvent';
import { charmQualifyingEventSchemaId, encodeCharmQualifyingEvent } from './charmQualifyingEvent';
import type { CharmUserIdentifier } from './charmUserIdentifier';
import { charmUserIdentifierSchemaId, encodeCharmUserIdentifier } from './charmUserIdentifier';
import type { ExternalCredential } from './external';
import { encodeExternalCredential, externalCredentialSchemaDefinition, externalCredentialSchemaId } from './external';
import type { GitcoinProjectCredential } from './gitcoinProjectSchema';
import { gitcoinProjectCredentialSchemaDefinition, gitcoinProjectCredentialSchemaId } from './gitcoinProjectSchema';
import { encodeGitcoinProjectCredential } from './gitcoinProjectUtils';
import type {
  OptimismProjectAttestationData,
  OptimismProjectSnapshotAttestationMetaData
} from './optimismProjectSchemas';
import {
  optimismProjectAttestationSchemaDefinition,
  optimismProjectAttestationSchemaId,
  optimismProjectSnapshotAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaId
} from './optimismProjectSchemas';
import { encodeOptimismProjectAttestation, encodeOptimismProjectSnapshotAttestation } from './optimismProjectUtils';
import type { ProposalCredential } from './proposal';
import { proposalCredentialSchemaDefinition, proposalCredentialSchemaId } from './proposal';
import { encodeProposalCredential } from './proposalUtils';
import type { RewardCredential } from './reward';
import { rewardCredentialSchemaDefinition, rewardCredentialSchemaId } from './reward';
import { encodeRewardCredential } from './rewardUtils';

export const allSchemaDefinitions = [
  proposalCredentialSchemaDefinition,
  rewardCredentialSchemaDefinition,
  externalCredentialSchemaDefinition,
  gitcoinProjectCredentialSchemaDefinition,
  optimismProjectAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaDefinition
];

export type ExtendedAttestationType =
  | PrismaAttestationType
  | 'gitcoinProject'
  | 'optimismProject'
  | 'optimismProjectSnapshot'
  | 'charmUserIdentifier'
  | 'charmQualifyingEvent'
  | 'charmProject'
  | 'charmProjectMetadata';

export const credentialLabels: Record<ExtendedAttestationType, string> = {
  proposal: 'Proposal',
  reward: 'Reward',
  external: 'External',
  gitcoinProject: 'Gitcoin Project',
  optimismProject: 'Optimism Project',
  optimismProjectSnapshot: 'Optimism Project Snapshot',
  charmUserIdentifier: 'CharmVerse User',
  charmQualifyingEvent: 'CharmVerse Qualifier',
  charmProject: 'CharmVerse Project',
  charmProjectMetadata: 'CharmVerse Project Metadata'
};

export const attestationSchemaIds: Record<ExtendedAttestationType, string> = {
  proposal: proposalCredentialSchemaId,
  reward: rewardCredentialSchemaId,
  external: externalCredentialSchemaId,
  gitcoinProject: gitcoinProjectCredentialSchemaId,
  optimismProject: optimismProjectAttestationSchemaId,
  optimismProjectSnapshot: optimismProjectSnapshotAttestationSchemaId,
  charmQualifyingEvent: charmQualifyingEventSchemaId,
  charmUserIdentifier: charmUserIdentifierSchemaId,
  charmProject: charmProjectSchemaId,
  charmProjectMetadata: charmProjectMetadataSchemaId
};

export const charmverseCredentialSchemas = [attestationSchemaIds.proposal, attestationSchemaIds.reward];

export type CredentialDataInput<T extends ExtendedAttestationType = ExtendedAttestationType> = T extends 'proposal'
  ? ProposalCredential
  : T extends 'reward'
    ? RewardCredential
    : T extends 'external'
      ? ExternalCredential
      : T extends 'gitcoinProject'
        ? GitcoinProjectCredential
        : T extends 'optimismProject'
          ? OptimismProjectAttestationData
          : T extends 'optimismProjectSnapshot'
            ? OptimismProjectSnapshotAttestationMetaData
            : T extends 'charmQualifyingEvent'
              ? CharmQualifyingEvent
              : T extends 'charmUserIdentifier'
                ? CharmUserIdentifier
                : T extends 'charmProject'
                  ? CharmProject
                  : T extends 'charmProjectMetadata'
                    ? CharmProjectMetadata
                    : never;

export type CredentialData<T extends ExtendedAttestationType = ExtendedAttestationType> = {
  type: T;
  data: CredentialDataInput<T>;
};

export function encodeAttestation<T extends ExtendedAttestationType = ExtendedAttestationType>({
  type,
  data
}: CredentialData<T>) {
  if (type === 'proposal') {
    return encodeProposalCredential(data as ProposalCredential);
  } else if (type === 'reward') {
    return encodeRewardCredential(data as RewardCredential);
  } else if (type === 'external') {
    return encodeExternalCredential(data as ExternalCredential);
  } else if (type === 'gitcoinProject') {
    return encodeGitcoinProjectCredential(data as GitcoinProjectCredential);
  } else if (type === 'optimismProject') {
    return encodeOptimismProjectAttestation(data as OptimismProjectAttestationData);
  } else if (type === 'optimismProjectSnapshot') {
    return encodeOptimismProjectSnapshotAttestation(data as OptimismProjectSnapshotAttestationMetaData);
  } else if (type === 'charmQualifyingEvent') {
    return encodeCharmQualifyingEvent(data as CharmQualifyingEvent);
  } else if (type === 'charmUserIdentifier') {
    return encodeCharmUserIdentifier(data as CharmUserIdentifier);
  } else if (type === 'charmProject') {
    return encodeCharmProject(data as CharmProject);
  } else if (type === 'charmProjectMetadata') {
    return encodeCharmProjectMetadata(data as CharmProjectMetadata);
  }
  throw new Error(`Invalid Attestation Type: ${type}'`);
}
