import type { QualifyingEventType } from '@charmverse/core/prisma-client';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

// This schema ID is bound to change as we move through resolver contract versions
export const charmProjectSchemaId = '0xffebe1dbfc8c97cd866b63e442d6c725b78bc4c2de0683d332d5de5e6c11bd19';

export const charmProjectSchemaDefinition =
  'string name,string category,string projectRefUID,string metadataSnapshotRefUID,string userRefUID';

export type CharmProject = {
  name: string;
  category: QualifyingEventType;
  projectRefUID: string;
  metadataSnapshotRefUID: string;
  userRefUID: string;
};

export function encodeCharmProject({
  name,
  category,
  projectRefUID,
  metadataSnapshotRefUID,
  userRefUID
}: CharmProject) {
  const encoder = new SchemaEncoder(charmProjectSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'name', value: name, type: 'string' },
    { name: 'category', value: category, type: 'string' },
    { name: 'projectRefUID', value: projectRefUID, type: 'string' },
    { name: 'metadataSnapshotRefUID', value: metadataSnapshotRefUID, type: 'string' },
    { name: 'userRefUID', value: userRefUID, type: 'string' }
  ] as TypedSchemaItem<CharmProject>[]);

  return encodedData;
}

export function decodeCharmProject(rawData: string): CharmProject {
  const decoder = new SchemaEncoder(charmProjectSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof CharmProject;
    acc[key] = item.value.value as any;
    return acc;
  }, {} as CharmProject);

  return values as CharmProject;
}
