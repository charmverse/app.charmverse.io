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
