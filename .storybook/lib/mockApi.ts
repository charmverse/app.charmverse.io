import type {
  ProposalPermissionFlags,
  ProposalCategoryWithPermissions,
  ProposalFlowPermissionFlags
} from '@charmverse/core/permissions';
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

const spaceHandlers = {
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

const pageHandlers = {
  pageComments: rest.get(`/api/pages/:pageId/comments`, (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  proposalTemplates: rest.get(`/api/spaces/:spaceId/proposal-templates`, (req, res, ctx) => {
    return res(ctx.json(proposalTemplates));
  })
};

const proposalHandlers = {
  proposalCategories: rest.get(`/api/spaces/:spaceId/proposal-categories`, (req, res, ctx) => {
    return res(ctx.json(proposalCategories));
  }),
  proposalTemplates: rest.get(`/api/spaces/:spaceId/proposal-templates`, (req, res, ctx) => {
    return res(ctx.json(proposalTemplates));
  }),
  proposalFlowFlags: rest.get(`/api/proposals/:pageId/compute-flow-flags`, (req, res, ctx) => {
    const permissions: ProposalFlowPermissionFlags = {
      draft: true,
      discussion: true,
      review: true,
      reviewed: true,
      vote_active: true,
      vote_closed: true,
      evaluation_active: true,
      evaluation_closed: true
    };
    return res(ctx.json(permissions));
  }),
  proposalPermissions: rest.get(`/api/permissions/proposals/compute-proposal-permissions`, (req, res, ctx) => {
    const permissions: ProposalPermissionFlags = {
      edit: true,
      view: true,
      delete: true,
      create_vote: true,
      vote: true,
      comment: true,
      review: true,
      evaluate: true,
      make_public: true,
      archive: true,
      unarchive: true
    };
    return res(ctx.json(permissions));
  })
};

export const handlers = {
  ...spaceHandlers,
  ...pageHandlers,
  ...proposalHandlers
};
