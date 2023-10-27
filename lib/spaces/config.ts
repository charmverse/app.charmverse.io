export const DOMAIN_BLACKLIST = [
  'api',
  'api-docs',
  'authenticate',
  'createSpace',
  'invite',
  'login',
  'images',
  'join',
  'share',
  'signup',
  'u',
  'loop'
];

export const staticSpaceTemplates = [
  {
    id: 'templateNftCommunity',
    name: 'NFT Community',
    apiName: 'nft_community'
  },
  {
    id: 'templateCreator',
    name: 'Creator',
    apiName: 'creator'
  },
  {
    id: 'templateGrantor',
    name: 'Grantor',
    apiName: 'grantor'
  },
  {
    id: 'templateGrantRecipient',
    name: 'Grant Recipient',
    apiName: 'grant_recipient'
  },
  {
    id: 'templateHackathon',
    name: 'Hackathon',
    apiName: 'hackathon'
  },
  {
    id: 'templateNounishDAO',
    name: 'Nounish DAO',
    apiName: 'nounish_dao'
  },
  {
    id: 'templateImpactCommunity',
    name: 'Impact Community',
    apiName: 'impact_community'
  }
] as const;

export const internalTemplates = ['templateGitcoin', 'templateOPGrant'] as const;

const dynamicTemplateIds = ['default', 'importNotion', 'importMarkdown'] as const;

export const spaceTemplateIds = [...staticSpaceTemplates.map((tpl) => tpl.id), ...dynamicTemplateIds];
export const spaceTemplateApiNames = [...staticSpaceTemplates.map((tpl) => tpl.apiName)];

export type StaticSpaceTemplateType = (typeof staticSpaceTemplates)[number]['id'];
export type APISpaceTemplateType = (typeof staticSpaceTemplates)[number]['apiName'];

type InternalTemplateType = (typeof internalTemplates)[number];

// Include internal templates
export type SpaceTemplateType = (typeof spaceTemplateIds)[number] | InternalTemplateType;
