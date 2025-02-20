export const gitcoinProjectCredentialSchemaId = '0xf8757b1e38ff1b0c1893e47f7d815367332bec28fea4b4abdcdfda3b1d1b9061';

export const gitcoinProjectCredentialSchemaDefinition =
  'string name,string metadataPtr,uint256 metadataType,bytes32 type,bytes32 round,string uuid';

export type GitcoinProjectCredential = {
  name: string;
  metadataPtr: string;
  metadataType: number;
  type: string;
  round: string;
  uuid: string;
};
