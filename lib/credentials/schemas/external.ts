import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const externalCredentialSchemaId = '0x2c315de4489ed6e189e609179383d279ccde1653b63d88b6cb9334a07defa61c'; // @TODO Update this

export const externalCredentialSchemaDefinition =
  'string Name,string ProjectId,string Event,string Date,string GrantRound,string Source,string GrantUrl,string URL';

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

export function encodeExternalCredential({
  Name,
  ProjectId,
  GrantRound,
  Event,
  Date,
  Source,
  GrantURL,
  URL
}: ExternalCredential) {
  const encoder = new SchemaEncoder(externalCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'Name', value: Name, type: 'string' },
    { name: 'ProjectId', value: ProjectId, type: 'string' },
    { name: 'GrantRound', value: GrantRound, type: 'string' },
    { name: 'Event', value: Event, type: 'string' },
    { name: 'Date', value: Date, type: 'string' },
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
