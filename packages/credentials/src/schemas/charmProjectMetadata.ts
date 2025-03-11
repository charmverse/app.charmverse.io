import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const charmProjectMetadataSchemaId = '0x959bd82eb76bb86c083e75e9545ee0145fbd080d6d8b4507ee44e1f5cabeef43';

export const charmProjectMetadataSchemaDefinition = 'string projectRefUID,string name,string metadataURL';

export type CharmProjectMetadata = {
  projectRefUID: string;
  name: string;
  metadataURL: string;
};

export function encodeCharmProjectMetadata({ projectRefUID, name, metadataURL }: CharmProjectMetadata) {
  const encoder = new SchemaEncoder(charmProjectMetadataSchemaDefinition);

  const encodedData = encoder.encodeData([
    { name: 'projectRefUID', value: projectRefUID, type: 'string' },
    { name: 'name', value: name, type: 'string' },
    { name: 'metadataURL', value: metadataURL, type: 'string' }
  ] as TypedSchemaItem<CharmProjectMetadata>[]);

  return encodedData;
}

export function decodeCharmProjectMetadata(rawData: string): CharmProjectMetadata {
  const decoder = new SchemaEncoder(charmProjectMetadataSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof CharmProjectMetadata;
    acc[key] = item.value.value as any;
    return acc;
  }, {} as CharmProjectMetadata);

  return values as CharmProjectMetadata;
}
