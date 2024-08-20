export const optimismProjectAttestationSchemaId = '0x7ae9f4adabd9214049df72f58eceffc48c4a69e920882f5b06a6c69a3157e5bd';

export const optimismProjectAttestationSchemaDefinition = 'uint256 farcasterID,string issuer';

export type OptimismProjectAttestationData = {
  farcasterID: number;
  issuer: string;
};

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
