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
  'u'
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
  },
  {
    id: 'templateGrantRecipient',
    name: 'Grant Recipient',
    apiName: 'grant_recipient'
  }
] as const;

export type StaticSpaceTemplateType = (typeof staticSpaceTemplates)[number]['id'];
export type APISpaceTemplateType = (typeof staticSpaceTemplates)[number]['apiName'];

const dynamicTemplateIds = ['default', 'importNotion', 'importMarkdown'] as const;

export const spaceTemplateIds = [...staticSpaceTemplates.map((tpl) => tpl.id), ...dynamicTemplateIds];
export type SpaceTemplateType = (typeof spaceTemplateIds)[number] | 'templateGitcoin';
