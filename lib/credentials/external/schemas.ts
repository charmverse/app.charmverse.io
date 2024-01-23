import { arbitrum, base, optimism } from 'viem/chains';

export const externalCredentialChains = [optimism.id, base.id, arbitrum.id] as const;

export type ExternalCredentialChain = (typeof externalCredentialChains)[number];

type SchemaSpamFilter = {
  schemaId: string;
  issuers: string[];
};

// Optimism schemas ------------------
// https://optimism.easscan.org/schema/view/0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b
const optimismRetroPgfBadgeHolderSchema: SchemaSpamFilter = {
  schemaId: '0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b',
  issuers: ['0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9']
};

// https://optimism.easscan.org/schema/view/0x3743be2afa818ee40304516c153427be55931f238d961af5d98653a93192cdb3
const optimismRetroPgfContributionSchema: SchemaSpamFilter = {
  schemaId: '0x3743be2afa818ee40304516c153427be55931f238d961af5d98653a93192cdb3',
  issuers: ['0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9']
};

// Base schemas ----------------------
// https://base.easscan.org/schema/view/0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9
const baseVerifiedAccountSchema: SchemaSpamFilter = {
  schemaId: '0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9',
  issuers: ['0x357458739F90461b99789350868CD7CF330Dd7EE']
};

// Arbitrum schemas ------------------
// https://arbitrum.easscan.org/schema/view/0x951fa7e07d6e852eb4535331db373786f5ab7249bb31d94cc4bd05250ebb6500
const arbitrumDevfolioQuadraticVotingAttestationSchema: SchemaSpamFilter = {
  schemaId: '0x951fa7e07d6e852eb4535331db373786f5ab7249bb31d94cc4bd05250ebb6500',
  issuers: ['0x8AdCfB84d861F510Ad01C24cf459abE1515BB9e8']
};

// https://arbitrum.easscan.org/schema/view/0x364a59df1d48d4b6c0f8f0c1176504b252bce5ce57e0d1ca75b1bf70c2f0ec14
const arbitrumDevfolioOnchainCredentialAttestationSchema: SchemaSpamFilter = {
  schemaId: '0x364a59df1d48d4b6c0f8f0c1176504b252bce5ce57e0d1ca75b1bf70c2f0ec14',
  issuers: ['0x3Ce7b2b2a9F3C27aFa6EC511679f606412fb497b', ' 0xB605589815E8C9771e75BD35A629642F9ed102A1']
};

// https://arbitrum.easscan.org/schema/view/0x6c8eb2f9520c7bd673bf4bb8ea475114e86a01e80a5d167ebc65a0baea122f9c
const arbitrumCheerSchema: SchemaSpamFilter = {
  schemaId: '0x6c8eb2f9520c7bd673bf4bb8ea475114e86a01e80a5d167ebc65a0baea122f9c',
  issuers: ['0x3Ce7b2b2a9F3C27aFa6EC511679f606412fb497b', '0xB605589815E8C9771e75BD35A629642F9ed102A1']
};

export const trackedSchemas: Record<ExternalCredentialChain, SchemaSpamFilter[]> = {
  [optimism.id]: [optimismRetroPgfBadgeHolderSchema, optimismRetroPgfContributionSchema],
  [base.id]: [baseVerifiedAccountSchema],
  [arbitrum.id]: [
    arbitrumDevfolioQuadraticVotingAttestationSchema,
    arbitrumDevfolioOnchainCredentialAttestationSchema,
    arbitrumCheerSchema
  ]
};
