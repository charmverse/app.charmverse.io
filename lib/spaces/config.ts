import { typedKeys } from 'lib/utilities/objects';

export enum SpaceTemplate {
  impact_community,
  hackathon,
  creator,
  nft_community,
  nounish_dao
}

export const DOMAIN_BLACKLIST = [
  'api',
  'api-docs',
  'authenticate',
  'createWorkspace',
  'invite',
  'login',
  'images',
  'join',
  'share',
  'signup',
  'u'
];

export const spaceContentTemplates = {
  templateNftCommunity: 'NFT Community',
  templateCreator: 'Creator',
  templateHackathon: 'Hackathon',
  templateNounishDAO: 'Nounish DAO',
  templateImpactCommunity: 'Impact Community'
};

const staticTemplateOptions = ['default', 'importNotion', 'importMarkdown'] as const;

export const SpaceTemplateMapping: Record<keyof typeof SpaceTemplate, keyof typeof spaceContentTemplates> = {
  creator: 'templateCreator',
  hackathon: 'templateHackathon',
  impact_community: 'templateImpactCommunity',
  nft_community: 'templateNftCommunity',
  nounish_dao: 'templateNounishDAO'
};

export type SpaceTemplateType = keyof typeof SpaceTemplateMapping;

export const spaceCreateTemplates = [...typedKeys(SpaceTemplateMapping), ...staticTemplateOptions];

export type SpaceCreateTemplate = (typeof spaceCreateTemplates)[number];
