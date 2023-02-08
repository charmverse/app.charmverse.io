import { typedKeys } from 'lib/utilities/objects';

export const DOMAIN_BLACKLIST = [
  'api',
  'api-docs',
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
  templateNftCommunity: 'NFT Community'
};

const staticTemplateOptions = ['default', 'importNotion', 'importMarkdown'] as const;

export const spaceCreateTemplates = [...typedKeys(spaceContentTemplates), ...staticTemplateOptions];

export type SpaceCreateTemplate = (typeof spaceCreateTemplates)[number];
