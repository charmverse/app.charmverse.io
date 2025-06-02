export const DOMAIN_BLACKLIST = [
  'api',
  'api-docs',
  'authenticate',
  'createSpace',
  'invite',
  // 'login', login is not part of this list, since it is used on custom domains and lives at [domain]/login
  'images',
  'join',
  'share',
  'signup',
  'loop',
  'permalink'
];

export const staticSpaceTemplates = [
  {
    id: 'templateNftCommunity',
    name: 'NFT Community',
    apiName: 'nft_community',
    domain: 'cvt-nft-community-template',
    spaceId: 'fabf2e24-fc13-41d6-b321-ba16dffcf882'
  },
  {
    id: 'templateCreator',
    name: 'Creator',
    apiName: 'creator',
    domain: 'cvt-template-creator',
    spaceId: '702fe846-919a-41f9-a20b-3b40fa07d5d8'
  },
  {
    id: 'templateGrantor',
    name: 'Grantor',
    apiName: 'grantor',
    domain: 'cvt-template-grantor',
    spaceId: '9e215a8f-d4b6-4097-af71-e1d148995d23'
  },
  {
    id: 'templateGaming',
    name: 'Gaming Community',
    apiName: 'gaming',
    domain: 'cvt-template-gaming',
    spaceId: '710c95c8-305a-49bb-a67b-c11659d41d7b'
  },
  {
    id: 'templateGrantRecipient',
    name: 'Grant Recipient',
    apiName: 'grant_recipient',
    domain: 'cvt-template-grant-recipient',
    spaceId: '3055a63c-b535-41fb-a178-281db8170bfe'
  },
  {
    id: 'templateHackathon',
    name: 'Hackathon',
    apiName: 'hackathon',
    domain: 'cvt-template-hackathon',
    spaceId: 'c57663bf-7cb0-4c6a-a77f-26932fd6dce7'
  },
  {
    id: 'templateNounishDAO',
    name: 'Nounish DAO',
    apiName: 'nounish_dao',
    domain: 'cvt-template-nounish-dao',
    spaceId: '278a443d-e0eb-49ea-ad39-411dea8164b9'
  },
  {
    id: 'templateImpactCommunity',
    name: 'Impact Community',
    apiName: 'impact_community',
    domain: 'cvt-template-impact-community',
    spaceId: '9d97ff21-ecd6-49d9-a01e-fa38741c5465'
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
