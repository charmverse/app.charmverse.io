import type { SpaceOperation, SpacePermissionConfigurationMode } from '@prisma/client';

import { spaceOperationLabels } from '../spaces/mapping';

import type { SpaceConfigurationPreset, SpacePermissionTemplate } from './interfaces';

const readOnly: SpacePermissionTemplate = {
  spaceOperations: {
    createBounty: false,
    createPage: false,
    createVote: false,
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
    createVote: true,
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
    createVote: true,
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

export const configurationModeName: Record<SpacePermissionConfigurationMode, string> = {
  custom: 'Custom settings',
  readOnly: 'Read-only space',
  collaborative: 'Collaborative space',
  open: 'Public space'
};

export const configurationModeDescription: Record<SpacePermissionConfigurationMode, string> = {
  custom: 'Manage settings individually.',
  readOnly: 'Members can only read existing content.',
  collaborative: 'Members can create and edit content.',
  open: 'Content created by members is available to the public by default.'
};

/**
 * Returns a tuple with what the user can and cannot do as a list of strings
 */
export function getTemplateExplanation(template: SpacePermissionConfigurationMode): [string[], string[]] {
  const canAndCannot: [string[], string[]] = [[], []];

  if (template === 'custom') {
    return canAndCannot;
  }

  const templateData = permissionTemplates[template];

  // eslint-disable-next-line camelcase
  const { moderateForums, createVote, ...applicableOperations } = templateData.spaceOperations;
  // Handle space operations
  for (const [operation, can] of Object.entries(applicableOperations) as [SpaceOperation, boolean][]) {
    const qualifier = can ? 'can' : 'cannot';

    const sentence = `Space members ${qualifier} ${spaceOperationLabels[operation].toLowerCase()}.`;

    if (can) {
      canAndCannot[0].push(sentence);
    } else {
      canAndCannot[1].push(sentence);
    }
  }

  // Explain the default page permission
  const { defaultPagePermissionGroup } = templateData.pagePermissionDefaults;

  if (defaultPagePermissionGroup === 'full_access') {
    canAndCannot[0].push('Space members can view, edit, comment on, share and delete new top-level pages by default.');
  } else if (defaultPagePermissionGroup === 'editor') {
    canAndCannot[0].push('Space members can view, edit and comment on new top-level pages by default.');
    canAndCannot[1].push('Space members cannot share or delete new top-level pages by default.');
  } else if (defaultPagePermissionGroup === 'view_comment') {
    canAndCannot[0].push('Space members can view and comment on new top-level pages by default.');
    canAndCannot[1].push('Space members cannot edit, share or delete new top-level pages by default.');
  } else if (templateData.pagePermissionDefaults.defaultPagePermissionGroup === 'view') {
    canAndCannot[0].push('Space members can view new top-level pages by default.');
    canAndCannot[1].push('Space members cannot comment on, edit, share or delete new top-level pages by default.');
  }

  // Explain if new top level pages will be public
  const { defaultPublicPages } = templateData.pagePermissionDefaults;

  if (defaultPublicPages) {
    canAndCannot[0].push('Anyone can see new top-level pages by default.');
  } else {
    canAndCannot[1].push('Anyone outside the space cannot see new top-level pages by default.');
  }

  // Explain the status of the bounty board
  const { publicBountyBoard } = templateData.pagePermissionDefaults;

  if (publicBountyBoard) {
    canAndCannot[0].push('Anyone can see bounties and bounty suggestions visible to space members.');
  } else {
    canAndCannot[1].push('Anyone outside the space cannot see bounties and bounty suggestions.');
  }

  return canAndCannot;
}
