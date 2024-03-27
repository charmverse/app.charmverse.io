export const externalCredentialSchemaId = '0x2ef0994b8591628ce92321818843f3851f461a6721dbed3d80d031441aeb6e52';

export const externalCredentialSchemaDefinition =
  'string Name,string ProjectId,string Event,string Date,string GrantRound,string Source,string GrantURL,string URL';

export type ExternalCredential = {
  Name: string;
  ProjectId: string; // external project id from our db
  Event: string; // e.g. Approved
  Date: string; // ISO string
  GrantRound: string;
  Source: string;
  GrantURL: string;
  URL: string;
};
