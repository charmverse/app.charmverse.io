import { externalCredentialSchemaDefinition, externalCredentialSchemaId } from './external';
import { gitcoinProjectCredentialSchemaDefinition, gitcoinProjectCredentialSchemaId } from './gitcoinProjectSchema';
import type { AttestationType } from './interfaces';
import {
  optimismProjectAttestationSchemaDefinition,
  optimismProjectAttestationSchemaId,
  optimismProjectSnapshotAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaId
} from './optimismProjectSchemas';
import { proposalCredentialSchemaId, proposalCredentialSchemaDefinition } from './proposal';
import { rewardCredentialSchemaId, rewardCredentialSchemaDefinition } from './reward';

export const allSchemaDefinitions = [
  proposalCredentialSchemaDefinition,
  rewardCredentialSchemaDefinition,
  externalCredentialSchemaDefinition,
  gitcoinProjectCredentialSchemaDefinition,
  optimismProjectAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaDefinition
];

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
