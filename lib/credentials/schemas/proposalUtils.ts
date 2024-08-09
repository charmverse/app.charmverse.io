import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';
import type { ProposalCredential } from './proposal';
import { proposalCredentialSchemaDefinition } from './proposal';

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
