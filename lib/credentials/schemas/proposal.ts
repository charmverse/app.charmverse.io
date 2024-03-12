import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const proposalCredentialSchemaId = '0x3d1afc69090e3133e65385364bd88f230d8df3e5e2c660fdc9206c0ce3e2e012';

export const proposalCredentialSchemaDefinition =
  'string Name,string Organization,string Description,string URL,string Event';

export type ProposalCredential = {
  Name: string;
  Description: string;
  Organization: string;
  URL: string;
  Event: string;
};

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
