import type { CharmversePrismaClient as Prisma } from '@charmverse/core';

import type { SpaceConfigurationPreset, SpacePermissionTemplate } from './interfaces';

const readOnly: SpacePermissionTemplate = {
  spaceOperations: {
    createBounty: false,
    createPage: false,
    createForumCategory: false,
    moderateForums: false,
    reviewProposals: false
  },
  pagePermissionDefaults: {
    defaultPagePermissionGroup: 'view',
    defaultPublicPages: false,
    publicBountyBoard: false
  }
};

const collaborative: SpacePermissionTemplate = {
  spaceOperations: {
    createPage: true,
    createBounty: true,
    createForumCategory: false,
    moderateForums: false,
    reviewProposals: true
  },
  pagePermissionDefaults: {
    defaultPagePermissionGroup: 'full_access',
    defaultPublicPages: false,
    publicBountyBoard: false
  }
};

const open: SpacePermissionTemplate = {
  spaceOperations: {
    createPage: true,
    createBounty: true,
    createForumCategory: false,
    moderateForums: false,
    reviewProposals: true
  },
  pagePermissionDefaults: {
    defaultPagePermissionGroup: 'full_access',
    defaultPublicPages: true,
    publicBountyBoard: true
  }
};

export const permissionTemplates: Record<SpaceConfigurationPreset, SpacePermissionTemplate> = {
  readOnly,
  collaborative,
  open
};

export const configurationModeName: Record<Prisma.SpacePermissionConfigurationMode, string> = {
  custom: 'Custom settings',
  readOnly: 'Read-only space',
  collaborative: 'Collaborative space',
  open: 'Public space'
};

export const configurationModeDescription: Record<Prisma.SpacePermissionConfigurationMode, string> = {
  custom: 'Manage settings individually.',
  readOnly: 'Members can only read existing content.',
  collaborative: 'Members can create and edit content.',
  open: 'Content created by members is available to the public by default.'
};
