import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { Member } from '../../lib/members/interfaces';
import { rest } from 'msw';
import { generateDefaultProposalCategoriesInput } from '../../lib/proposal/generateDefaultProposalCategoriesInput';
import { createMockUser } from '../../testing/mocks/user';
import { createMockSpace } from '../../testing/mocks/space';
import { createMockSpaceMember } from '../../testing/mocks/spaceMember';
import type { SpacePermissionFlags } from '../../lib/permissions/spaces';
import { ListSpaceRolesResponse } from '../../pages/api/roles/index';

// mock requests globally via msw. see : https://storybook.js.org/addons/msw-storybook-addon
const userProfile = createMockUser();
const spaces = [createMockSpace()];
const members: Member[] = [
  createMockSpaceMember(),
  createMockSpaceMember(),
  createMockSpaceMember(),
  createMockSpaceMember(),
  createMockSpaceMember()
];
const spaceRoles: ListSpaceRolesResponse[] = [
  { id: '1', name: 'Moderator', spacePermissions: [], source: null },
  { id: '1', name: 'Grant Reviewer', spacePermissions: [], source: null }
];
const proposalCategories: ProposalCategoryWithPermissions[] = generateDefaultProposalCategoriesInput('space-id').map(
  (cat) => ({
    ...cat
  })
);
const proposalTemplates: ProposalWithUsers[] = [];

export const handlers = {
  proposalCategories: rest.get(`/api/spaces/:spaceId/proposal-categories`, (req, res, ctx) => {
    return res(ctx.json(proposalCategories));
  }),
  proposalTemplates: rest.get(`/api/spaces/:spaceId/proposal-templates`, (req, res, ctx) => {
    return res(ctx.json(proposalTemplates));
  }),
  spaceMembers: rest.get(`/api/spaces/:spaceId/members`, (req, res, ctx) => {
    return res(ctx.json(members));
  }),
  spacePermissions: rest.get(`/api/permissions/space/:spaceId/compute`, (req, res, ctx) => {
    const permissions: SpacePermissionFlags = {
      createPage: true,
      createBounty: true,
      createForumCategory: true,
      moderateForums: true,
      reviewProposals: true,
      deleteAnyPage: true,
      deleteAnyBounty: true,
      deleteAnyProposal: true
    };
    return res(ctx.json(permissions));
  }),
  spaceRoles: rest.get(`/api/roles`, (req, res, ctx) => {
    return res(ctx.json(spaceRoles));
  }),
  spaces: rest.get(`/api/spaces`, (req, res, ctx) => {
    return res(ctx.json(spaces));
  })
};
