// 1. Loan Officer Schema used by Financial Institution for verifying a loan officer
import type { SchemaItem } from '@ethereum-attestation-service/eas-sdk';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { EasSchemaChain } from './connectors';

export type ProposalCredential = {
  name: string;
  description: string;
  organization: string;
  url: string;
  status: string;
};

type TypedSchemaItem<T> = SchemaItem & { name: keyof T };

export const proposalCredentialSchemaDefinition =
  'string name, string description, string organization, string url, string status';

export function encodeProposalCredential({ description, name, organization, status, url }: ProposalCredential) {
  const encoder = new SchemaEncoder(proposalCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'name', value: name, type: 'string' },
    { name: 'description', value: description, type: 'string' },
    { name: 'organization', value: organization, type: 'string' },
    { name: 'status', value: status, type: 'string' },
    { name: 'url', value: url, type: 'string' }
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
export const supportedCredentialTypes = ['proposal'] as const;

export type CredentialType = (typeof supportedCredentialTypes)[number];

export const credentialLabels: Record<CredentialType, string> = {
  proposal: 'Proposal'
};

export const attestationSchemaIds: Record<CredentialType, { [key in EasSchemaChain]: string }> = {
  proposal: {
    '10': '0x20770d8c0a19668aa843240ddf6d57025334b346171c28dfed1a7ddb16928b89'
  }
};
export type CredentialData<T extends CredentialType = CredentialType> = {
  type: T;
  data: T extends 'proposal' ? ProposalCredential : never;
};

export function encodeAttestion<T extends CredentialType = CredentialType>({ type, data }: CredentialData<T>) {
  if (type === 'proposal') {
    return encodeProposalCredential(data as ProposalCredential);
  }
  throw new Error('Invalid Attestation Type:', type);
}
