import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

import type { TypedSchemaItem } from './interfaces';
import {
  optimismProjectAttestationSchemaDefinition,
  optimismProjectSnapshotAttestationSchemaDefinition
} from './optimismProjectSchemas';
import type {
  OptimismProjectAttestationData,
  OptimismProjectSnapshotAttestationMetaData
} from './optimismProjectSchemas';

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
