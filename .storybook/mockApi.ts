import { rest } from 'msw';
import type { BlockCountInfo } from '../lib/spaces/getSpaceBlockCount';
import { getDefaultWorkflows } from '../lib/proposals/workflows/defaultWorkflows';
import type { SpacePermissionFlags } from '../lib/permissions/spaces';

import {
  spaces,
  members,
  spaceRoles,
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
  spaceBlockCount: rest.get(`/api/spaces/:spaceId/block-count`, (req, res, ctx) => {
    const result: Partial<BlockCountInfo> = { count: 1000 };
    return res(ctx.json(result));
  })
};

const pageHandlers = {
  pageComments: rest.get(`/api/pages/:pageId/comments`, (req, res, ctx) => {
    return res(ctx.json([]));
  })
};

const proposalHandlers = {
  proposalTemplates: rest.get(`/api/spaces/:spaceId/proposal-templates`, (req, res, ctx) => {
    return res(ctx.json(proposalTemplates));
  }),
  proposalWorkflows: rest.get(`/api/spaces/:spaceId/proposals/workflows`, (req, res, ctx) => {
    return res(ctx.json(getDefaultWorkflows(req.params.spaceId as string)));
  })
};

const rewardHandlers = {
  rewardBlocks: rest.get(`/api/spaces/:spaceId/rewards/blocks`, (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  rewardTemplates: rest.get(`/api/spaces/:spaceId/reward-templates`, (req, res, ctx) => {
    return res(ctx.json([]));
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
  ...rewardHandlers,
  ...userHandlers
};
