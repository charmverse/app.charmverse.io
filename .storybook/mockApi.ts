import type { ProposalPermissionFlags, ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import { rest } from 'msw';
import type { BlockCountInfo } from 'lib/spaces/getSpaceBlockCount';
import { getDefaultWorkflows } from 'lib/spaces/workflowTemplates';
import type { SpacePermissionFlags } from '../lib/permissions/spaces';

import {
  spaces,
  members,
  spaceRoles,
  proposalCategories,
  proposalTemplates,
  userProfile,
  userMemberProfile
} from '../stories/lib/mockData';

// mock requests globally via msw. see : https://storybook.js.org/addons/msw-storybook-addon

const spaceHandlers = {
  // mock tracking requests
  track: rest.post(`/api/events`, (req, res, ctx) => {
    return res(ctx.json({}));
  }),
  spaceMembers: rest.get(`/api/spaces/:spaceId/members`, (req, res, ctx) => {
    return res(ctx.json([userMemberProfile, ...members]));
  }),
  spaceMemberProperties: rest.get(`/api/spaces/:spaceId/members/properties`, (req, res, ctx) => {
    return res(ctx.json([]));
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
  }),
  proposalWorkflows: rest.get(`/api/spaces/:spaceId/proposals/workflows`, (req, res, ctx) => {
    return res(ctx.json(getDefaultWorkflows(req.params.spaceId)));
  }),
  spaceBlockCount: rest.get(`/api/spaces/:spaceId/block-count`, (req, res, ctx) => {
    const result: BlockCountInfo = { count: 1000 };
    return res(ctx.json(result));
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
  reviewerIds: rest.get(`/api/proposals/:pageId/get-user-reviewerids`, (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  proposalPermissions: rest.post(`/api/permissions/proposals/compute-proposal-permissions`, (req, res, ctx) => {
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

const userHandlers = {
  userProfile: rest.get(`/api/profile`, (req, res, ctx) => {
    return res(ctx.json(userProfile));
  }),
  notificationsList: rest.get(`/api/notifications/list`, (req, res, ctx) => {
    return res(ctx.json([]));
  })
};

export const handlers = {
  ...spaceHandlers,
  ...pageHandlers,
  ...proposalHandlers,
  ...userHandlers
};
