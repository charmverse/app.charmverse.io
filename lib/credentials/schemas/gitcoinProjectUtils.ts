import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import { gitcoinProjectCredentialSchemaDefinition } from './gitcoinProjectSchema';
import type { GitcoinProjectCredential } from './gitcoinProjectSchema';
import type { TypedSchemaItem } from './interfaces';

export function encodeGitcoinProjectCredential({
  name,
  metadataPtr,
  metadataType,
  type,
  round,
  uuid
}: GitcoinProjectCredential) {
  const encoder = new SchemaEncoder(gitcoinProjectCredentialSchemaDefinition);

  const encodedData = encoder.encodeData([
    { name: 'name', value: name, type: 'string' },
    { name: 'metadataPtr', value: metadataPtr, type: 'string' },
    { name: 'metadataType', value: metadataType, type: 'uint256' },
    { name: 'type', value: type, type: 'bytes32' },
    { name: 'round', value: round, type: 'bytes32' },
    { name: 'uuid', value: uuid, type: 'string' }
  ] as TypedSchemaItem<GitcoinProjectCredential>[]);

  return encodedData;
}

export function decodeGitcoinProjectCredential(rawData: string): GitcoinProjectCredential {
  const decoder = new SchemaEncoder(gitcoinProjectCredentialSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof GitcoinProjectCredential;

    if (key === 'metadataType') {
      acc.metadataType = parseInt(item.value.value as string);
    } else {
      acc[key] = item.value.value as string;
    }
    return acc;
  }, {} as GitcoinProjectCredential);

  return values as GitcoinProjectCredential;
}
