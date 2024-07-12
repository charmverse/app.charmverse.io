import type { QualifyingEventType } from '@charmverse/core/prisma-client';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

// This schema ID is bound to change as we move through resolver contract versions
export const charmQualifyingEventSchemaId = '0x056dbcd02b356c8efb77eb15b30695916604130921f5fbfe4dd75707db642822';

export const charmQualifyingEventSchemaDefinition =
  'string name,string category,string projectRefUID,string metadataSnapshotRefUID,string userRefUID';

export type CharmQualifyingEvent = {
  name: string;
  category: QualifyingEventType;
  projectRefUID: string;
  metadataSnapshotRefUID: string;
  userRefUID: string;
};

export function encodeCharmQualifyingEvent({
  name,
  category,
  projectRefUID,
  metadataSnapshotRefUID,
  userRefUID
}: CharmQualifyingEvent) {
  const encoder = new SchemaEncoder(charmQualifyingEventSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'name', value: name, type: 'string' },
    { name: 'category', value: category, type: 'string' },
    { name: 'projectRefUID', value: projectRefUID, type: 'string' },
    { name: 'metadataSnapshotRefUID', value: metadataSnapshotRefUID, type: 'string' },
    { name: 'userRefUID', value: userRefUID, type: 'string' }
  ] as TypedSchemaItem<CharmQualifyingEvent>[]);

  return encodedData;
}

export function decodeCharmQualifyingEvent(rawData: string): CharmQualifyingEvent {
  const decoder = new SchemaEncoder(charmQualifyingEventSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof CharmQualifyingEvent;
    acc[key] = item.value.value as any;
    return acc;
  }, {} as CharmQualifyingEvent);

  return values as CharmQualifyingEvent;
}
