import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const charmProjectSchemaId = '0xfb79325c991ed799aacb8cc42725c474e2a43e96d972d0c17af5a926e5716105';

export const charmProjectSchemaDefinition = 'string uid, string authorRefUID';

export type CharmProject = {
  authorRefUID: string;
  uid: string;
};

export function encodeCharmProject({ authorRefUID, uid }: CharmProject) {
  const encoder = new SchemaEncoder(charmProjectSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'uid', value: uid, type: 'string' },
    { name: 'authorRefUID', value: authorRefUID, type: 'string' }
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
