import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const externalCredentialSchemaId = '0x2c315de4489ed6e189e609179383d279ccde1653b63d88b6cb9334a07defa61c';

export const externalCredentialSchemaDefinition = 'string Name,string EcosystemURL';

export type ExternalCredential = {
  Name: string;
  GrantRound: string;
  ProposalURL: string;
};

export function encodeExternalCredential({ Name, ProposalURL, GrantRound }: ExternalCredential) {
  const encoder = new SchemaEncoder(externalCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'Name', value: Name, type: 'string' },
    { name: 'GrantRound', value: GrantRound, type: 'string' },
    { name: 'EcosystemURL', value: ProposalURL, type: 'string' }
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
