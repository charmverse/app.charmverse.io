import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';
import type { RewardCredential } from './reward';
import { rewardCredentialSchemaDefinition } from './reward';

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
