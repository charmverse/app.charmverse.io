import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const charmUserIdentifierSchemaId = '0x235844d6857140c2a38dd10c6e7ee1b34e7810fc185264234351cc8942bd63bf';

export const charmUserIdentifierSchemaDefinition = 'string uid';

export type CharmUserIdentifier = {
  uid: string;
};

export function encodeCharmUserIdentifier({ uid }: CharmUserIdentifier) {
  const encoder = new SchemaEncoder(charmUserIdentifierSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'uid', value: uid, type: 'string' }
  ] as TypedSchemaItem<CharmUserIdentifier>[]);

  return encodedData;
}

export function decodeCharmUserIdentifier(rawData: string): CharmUserIdentifier {
  const decoder = new SchemaEncoder(charmUserIdentifierSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof CharmUserIdentifier;
    acc[key] = item.value.value as string;
    return acc;
  }, {} as CharmUserIdentifier);

  return values as CharmUserIdentifier;
}
