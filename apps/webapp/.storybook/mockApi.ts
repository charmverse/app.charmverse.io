import { http, HttpResponse } from 'msw';
import type { BlockCountInfo } from '../@packages/spaces/getSpaceBlockCount';
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
  track: http.post(`/api/events`, () => {
    return HttpResponse.json({});
  }),
  spaceMembers: http.get(`/api/spaces/:spaceId/members`, () => {
    return HttpResponse.json([userMemberProfile, ...members]);
  }),
  spaceMemberProperties: http.get(`/api/spaces/:spaceId/members/properties`, () => {
    return HttpResponse.json([]);
  }),
  spacePermissions: http.get(`/api/permissions/space/:spaceId/compute`, () => {
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
    return HttpResponse.json(permissions);
  }),
  spaceRoles: http.get(`/api/roles`, () => {
    return HttpResponse.json(spaceRoles);
  }),
  spaces: http.get(`/api/spaces`, () => {
    return HttpResponse.json(spaces);
  }),
  spaceBlockCount: http.get(`/api/spaces/:spaceId/block-count`, () => {
    const result: Partial<BlockCountInfo> = { count: 1000 };
    return HttpResponse.json(result);
  })
};

const pageHandlers = {
  pageComments: http.get(`/api/pages/:pageId/comments`, () => {
    return HttpResponse.json([]);
  })
};

const proposalHandlers = {
  proposalTemplates: http.get(`/api/spaces/:spaceId/proposal-templates`, () => {
    return HttpResponse.json(proposalTemplates);
  }),
  proposalWorkflows: http.get(`/api/spaces/:spaceId/proposals/workflows`, ({ params }) => {
    return HttpResponse.json(getDefaultWorkflows(params.spaceId as string));
  })
};

const rewardHandlers = {
  rewardBlocks: http.get(`/api/spaces/:spaceId/rewards/blocks`, () => {
    return HttpResponse.json([]);
  }),
  rewardTemplates: http.get(`/api/spaces/:spaceId/reward-templates`, () => {
    return HttpResponse.json([]);
  })
};

const userHandlers = {
  userProfile: http.get(`/api/profile`, () => {
    return HttpResponse.json(userProfile);
  }),
  notificationsList: http.get(`/api/notifications/list`, () => {
    return HttpResponse.json([]);
  })
};

export const handlers = {
  ...spaceHandlers,
  ...pageHandlers,
  ...proposalHandlers,
  ...rewardHandlers,
  ...userHandlers
};
