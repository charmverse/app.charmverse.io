import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const externalCredentialSchemaId = '0x2ef0994b8591628ce92321818843f3851f461a6721dbed3d80d031441aeb6e52';

export const externalCredentialSchemaDefinition =
  'string Name,string ProjectId,string Event,string Date,string GrantRound,string Source,string GrantURL,string URL';

export type ExternalCredential = {
  Name: string;
  ProjectId: string; // external project id from our db
  Event: string; // e.g. Approved
  Date: string; // ISO string
  GrantRound: string;
  Source: string;
  GrantURL: string;
  URL: string;
};

// Metadata for external projects table
export type ExternalProjectMetadata = {
  name: string;
  round?: string;
  proposalId: string;
  proposalUrl: string;
  website?: string;
  twitter?: string;
  github?: string;
  email?: string;
};

export function encodeExternalCredential({
  Name,
  ProjectId,
  Event,
  Date,
  GrantRound,
  Source,
  GrantURL,
  URL
}: ExternalCredential) {
  const encoder = new SchemaEncoder(externalCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'Name', value: Name, type: 'string' },
    { name: 'ProjectId', value: ProjectId, type: 'string' },
    { name: 'Event', value: Event, type: 'string' },
    { name: 'Date', value: Date, type: 'string' },
    { name: 'GrantRound', value: GrantRound, type: 'string' },
    { name: 'Source', value: Source, type: 'string' },
    { name: 'GrantURL', value: GrantURL, type: 'string' },
    { name: 'URL', value: URL, type: 'string' }
  ] as TypedSchemaItem<ExternalCredential>[]);

  return encodedData;
}

export function decodeExternalCredential(rawData: string): ExternalCredential {
  const decoder = new SchemaEncoder(externalCredentialSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    acc[item.name as keyof ExternalCredential] = item.value.value as string;
    return acc;
  }, {} as ExternalCredential);

  return values as ExternalCredential;
}
