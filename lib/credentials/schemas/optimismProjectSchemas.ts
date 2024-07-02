import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';

export const optimismProjectAttestationSchemaId = '0x7ae9f4adabd9214049df72f58eceffc48c4a69e920882f5b06a6c69a3157e5bd';

export const optimismProjectAttestationSchemaDefinition = 'uint256 farcasterID,string issuer';

export type OptimismProjectAttestationData = {
  farcasterID: number;
  issuer: string;
};

export function encodeOptimismProjectAttestation({ farcasterID, issuer }: OptimismProjectAttestationData) {
  const encoder = new SchemaEncoder(optimismProjectAttestationSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'farcasterID', value: farcasterID, type: 'uint256' },
    { name: 'issuer', value: issuer, type: 'string' }
  ] as TypedSchemaItem<OptimismProjectAttestationData>[]);

  return encodedData;
}

export function decodeOptimismProjectAttestation(rawData: string): OptimismProjectAttestationData {
  const decoder = new SchemaEncoder(optimismProjectAttestationSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof OptimismProjectAttestationData;

    if (key === 'farcasterID') {
      acc.farcasterID = parseInt(item.value.value as string);
    } else {
      acc[key] = item.value.value as string;
    }
    return acc;
  }, {} as OptimismProjectAttestationData);

  return values as OptimismProjectAttestationData;
}

// Pt. 2 - Snapshot of state for an optimism attestation

export const optimismProjectSnapshotAttestationSchemaId =
  '0xe035e3fe27a64c8d7291ae54c6e85676addcbc2d179224fe7fc1f7f05a8c6eac';

export const optimismProjectSnapshotAttestationSchemaDefinition =
  'bytes32 projectRefUID,uint256 farcasterID,string name,string category,bytes32 parentProjectRefUID,uint8 metadataType,string metadataUrl';

export type OptimismProjectSnapshotAttestationMetaData = {
  projectRefUID: string;
  farcasterID: number;
  name: string;
  category: string;
  parentProjectRefUID: string;
  metadataType: number;
  metadataUrl: string;
};

export function encodeOptimismProjectSnapshotAttestation({
  farcasterID,
  category,
  metadataType,
  metadataUrl,
  name,
  parentProjectRefUID,
  projectRefUID
}: OptimismProjectSnapshotAttestationMetaData) {
  const encoder = new SchemaEncoder(optimismProjectSnapshotAttestationSchemaDefinition);
  const encodedData = encoder.encodeData([
    { name: 'projectRefUID', value: projectRefUID, type: 'bytes32' },
    { name: 'farcasterID', value: farcasterID, type: 'uint256' },
    { name: 'name', value: name, type: 'string' },
    { name: 'category', value: category, type: 'string' },
    { name: 'parentProjectRefUID', value: parentProjectRefUID, type: 'bytes32' },
    { name: 'metadataType', value: metadataType, type: 'uint8' },
    { name: 'metadataUrl', value: metadataUrl, type: 'string' }
  ] as TypedSchemaItem<OptimismProjectSnapshotAttestationMetaData>[]);

  return encodedData;
}

export function decodeOptimismProjectSnapshotAttestation(rawData: string): OptimismProjectSnapshotAttestationMetaData {
  const decoder = new SchemaEncoder(optimismProjectSnapshotAttestationSchemaDefinition);
  const parsed = decoder.decodeData(rawData);
  const values = parsed.reduce((acc, item) => {
    const key = item.name as keyof OptimismProjectSnapshotAttestationMetaData;

    if (key === 'farcasterID' || key === 'metadataType') {
      acc[key] = parseInt(item.value.value as string);
    } else {
      acc[key] = item.value.value as string;
    }
    return acc;
  }, {} as OptimismProjectSnapshotAttestationMetaData);

  return values as OptimismProjectSnapshotAttestationMetaData;
}
