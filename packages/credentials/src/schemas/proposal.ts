export const proposalCredentialSchemaId = '0x3d1afc69090e3133e65385364bd88f230d8df3e5e2c660fdc9206c0ce3e2e012';

export const proposalCredentialSchemaDefinition =
  'string Name,string Organization,string Description,string URL,string Event';

export type ProposalCredential = {
  Name: string;
  Description: string;
  Organization: string;
  URL: string;
  Event: string;
};
