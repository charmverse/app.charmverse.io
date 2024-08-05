import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const rewardCredentialSchemaId = '0xe44e40484c72af72b4661e37058a8204390f96bb9c8f73e943b0bf6e6fa03d7b';

export const rewardCredentialSchemaDefinition =
  'string Name,string Organization,string Description,string rewardURL,string Event';

export type RewardCredential = {
  Name: string;
  Description: string;
  Organization: string;
  rewardURL: string;
  Event: string;
};

export function encodeRewardCredential({ Description, Name, Organization, Event, rewardURL }: RewardCredential) {
  const encoder = new SchemaEncoder(rewardCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'Name', value: Name, type: 'string' },
    { name: 'Organization', value: Organization, type: 'string' },
    { name: 'Description', value: Description, type: 'string' },
    { name: 'rewardURL', value: rewardURL, type: 'string' },
    { name: 'Event', value: Event, type: 'string' }
  ] as TypedSchemaItem<RewardCredential>[]);

  return encodedData;
}

export function decodeRewardCredential(rawData: string): RewardCredential {
  const decoder = new SchemaEncoder(rewardCredentialSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    acc[item.name as keyof RewardCredential] = item.value.value as string;
    return acc;
  }, {} as RewardCredential);

  return values as RewardCredential;
}
