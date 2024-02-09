// 1. Loan Officer Schema used by Financial Institution for verifying a loan officer
import type { AttestationType } from '@charmverse/core/prisma';
import type { SchemaItem } from '@ethereum-attestation-service/eas-sdk';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { optimism } from 'viem/chains';

import type { EasSchemaChain } from './connectors';

export type ProposalCredential = {
  Name: string;
  Description: string;
  Organization: string;
  URL: string;
  Event: string;
};

type TypedSchemaItem<T> = SchemaItem & { name: keyof T };

export const proposalCredentialSchemaDefinition =
  'string Name,string Organization,string Description,string URL,string Event';

export function encodeProposalCredential({ Description, Name, Organization, Event, URL }: ProposalCredential) {
  const encoder = new SchemaEncoder(proposalCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'Name', value: Name, type: 'string' },
    { name: 'Organization', value: Organization, type: 'string' },
    { name: 'Description', value: Description, type: 'string' },
    { name: 'URL', value: URL, type: 'string' },
    { name: 'Event', value: Event, type: 'string' }
  ] as TypedSchemaItem<ProposalCredential>[]);

  return encodedData;
}

export function decodeProposalCredential(rawData: string): ProposalCredential {
  const decoder = new SchemaEncoder(proposalCredentialSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    acc[item.name as keyof ProposalCredential] = item.value.value as string;
    return acc;
  }, {} as ProposalCredential);

  return values as ProposalCredential;
}
export const credentialLabels: Record<AttestationType, string> = {
  proposal: 'Proposal'
};

export const attestationSchemaIds: Record<AttestationType, { [key in EasSchemaChain]: string }> = {
  proposal: {
    [optimism.id]: '0x3d1afc69090e3133e65385364bd88f230d8df3e5e2c660fdc9206c0ce3e2e012'
  }
};

export type CredentialData<T extends AttestationType = AttestationType> = {
  type: T;
  data: T extends 'proposal' ? ProposalCredential : never;
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
  }
  throw new Error('Invalid Attestation Type:', type);
}
