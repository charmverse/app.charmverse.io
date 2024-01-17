// 1. Loan Officer Schema used by Financial Institution for verifying a loan officer
import type { AttestationType } from '@charmverse/core/prisma';
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
  'string name,string organization,string description,string url,string status';

export function encodeProposalCredential({ description, name, organization, status, url }: ProposalCredential) {
  const encoder = new SchemaEncoder(proposalCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'name', value: name, type: 'string' },
    { name: 'organization', value: organization, type: 'string' },
    { name: 'description', value: description, type: 'string' },
    { name: 'url', value: url, type: 'string' },
    { name: 'status', value: status, type: 'string' }
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
    10: '0x20770d8c0a19668aa843240ddf6d57025334b346171c28dfed1a7ddb16928b89'
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
