import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const gitcoinProjectCredentialSchemaId = '0xd00c966351896bd3dc37d22017bf1ef23165f859d7546a2aba12a01623dec912';

export const gitcoinProjectCredentialSchemaDefinition =
  'string name,string metadataPtr,uint256 metadataType,bytes32 type,bytes32 round';

export type GitcoinProjectCredential = {
  name: string;
  metadataPtr: string;
  metadataType: number;
  type: string;
  round: string;
};

export function encodeGitcoinProjectCredential({
  name,
  metadataPtr,
  metadataType,
  type,
  round
}: GitcoinProjectCredential) {
  const encoder = new SchemaEncoder(gitcoinProjectCredentialSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'name', value: name, type: 'string' },
    { name: 'metadataPtr', value: metadataPtr, type: 'string' },
    { name: 'metadataType', value: metadataType, type: 'uint256' },
    { name: 'type', value: type, type: 'bytes32' },
    { name: 'round', value: round, type: 'bytes32' }
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
