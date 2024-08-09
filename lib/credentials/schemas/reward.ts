export const rewardCredentialSchemaId = '0xe44e40484c72af72b4661e37058a8204390f96bb9c8f73e943b0bf6e6fa03d7b';

export const rewardCredentialSchemaDefinition =
  'string Name,string Organization,string Description,string rewardURL,string Event';

export type RewardCredential = {
  Name: string;
  Description: string;
  Organization: string;
  rewardURL: string;
  Event: string;
};
