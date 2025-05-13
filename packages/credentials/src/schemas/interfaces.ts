import type { AttestationType as PrismaAttestationType } from '@charmverse/core/prisma';
import type { SchemaItem } from '@ethereum-attestation-service/eas-sdk';

import type { ExternalCredential } from './external';
import type { GitcoinProjectCredential } from './gitcoinProjectSchema';
import type {
  OptimismProjectAttestationData,
  OptimismProjectSnapshotAttestationMetaData
} from './optimismProjectSchemas';
import type { ProposalCredential } from './proposal';
import type { RewardCredential } from './reward';

export type TypedSchemaItem<T> = SchemaItem & { name: keyof T };

export type AttestationType = PrismaAttestationType | 'gitcoinProject' | 'optimismProject' | 'optimismProjectSnapshot';

export type CredentialDataInput<T extends AttestationType = AttestationType> = T extends 'proposal'
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
            : never;

export type CredentialData<T extends AttestationType = AttestationType> = {
  type: T;
  data: CredentialDataInput<T>;
};
