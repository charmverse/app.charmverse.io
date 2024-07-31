import type { QualifyingEventType } from '@charmverse/core/prisma-client';
import { SchemaEncoder, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';

import { NULL_ADDRESS } from '../constants';

import type { TypedSchemaItem } from './interfaces';

// This schema ID is bound to change as we move through resolver contract versions
export const charmProjectSchemaId = '0xffebe1dbfc8c97cd866b63e442d6c725b78bc4c2de0683d332d5de5e6c11bd19';

export const charmProjectSchemaDefinition = 'string projectUid';

export type CharmProject = {
  projectUid: string;
};

export function encodeCharmProject({ projectUid }: CharmProject) {
  const encoder = new SchemaEncoder(charmProjectSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'projectUid', value: projectUid, type: 'string' }
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

// console.log(getSchemaUID(charmProjectSchemaId, NULL_ADDRESS, false));
