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

export const spaceTemplateLabelMapping = {
  templateNftCommunity: 'NFT Community',
  templateCreator: 'Creator',
  templateHackathon: 'Hackathon',
  templateNounishDAO: 'Nounish DAO',
  templateImpactCommunity: 'Impact Community'
};

const staticTemplateOptions = ['default', 'importNotion', 'importMarkdown'] as const;

export const spaceInternalTemplateMapping: Record<keyof typeof SpaceTemplate, keyof typeof spaceTemplateLabelMapping> =
  {
    creator: 'templateCreator',
    hackathon: 'templateHackathon',
    impact_community: 'templateImpactCommunity',
    nft_community: 'templateNftCommunity',
    nounish_dao: 'templateNounishDAO'
  };

export type SpaceTemplateType = keyof typeof SpaceTemplate;

export const spaceCreateTemplates = [...typedKeys(spaceInternalTemplateMapping), ...staticTemplateOptions];

export type SpaceCreateTemplate = (typeof spaceCreateTemplates)[number];
