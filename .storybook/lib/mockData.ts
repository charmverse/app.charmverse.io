import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { ListSpaceRolesResponse } from '../../pages/api/roles/index';
import { generateDefaultProposalCategoriesInput } from '../../lib/proposal/generateDefaultProposalCategoriesInput';
import { createMockUser } from '../../testing/mocks/user';
import { createMockSpace } from '../../testing/mocks/space';
import { createMockSpaceMember } from '../../testing/mocks/spaceMember';
import type { Member } from '../../lib/members/interfaces';
import type { GetTasksResponse } from '../../pages/api/tasks/list';
import { brandColorNames } from 'theme/colors';

const userProfileSeed = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10'

// write a list of uuids here
const seeds = [
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17'
];

export const spaces = [createMockSpace()];
export const userProfile = createMockUser({ id: userProfileSeed });
export const userMemberProfile: Member = createMockSpaceMember(userProfile);
export const members: Member[] = [
  createMockSpaceMember(createMockUser({ id: seeds[0] })),
  createMockSpaceMember(createMockUser({ id: seeds[1] })),
  createMockSpaceMember(createMockUser({ id: seeds[2] })),
  createMockSpaceMember(createMockUser({ id: seeds[3] })),
  createMockSpaceMember(createMockUser({ id: seeds[4] }))
];
export const spaceRoles: ListSpaceRolesResponse[] = [
  { id: '1', name: 'Moderator', spacePermissions: [], source: null },
  { id: '1', name: 'Grant Reviewer', spacePermissions: [], source: null }
];
export const proposalCategories: ProposalCategoryWithPermissions[] = generateDefaultProposalCategoriesInput(
  'space-id'
).map((cat, i) => ({
  id: 'some-id',
  permissions: {
    manage_permissions: true,
    edit: true,
    delete: true,
    create_proposal: true,
    view_category: true,
    comment_proposals: true,
    vote_proposals: true
  },
  ...cat,
  color: brandColorNames[i % brandColorNames.length]
}));

export const proposalTemplates: ProposalWithUsers[] = [];

export const userTasks: GetTasksResponse = {
  discussions: { marked: [], unmarked: [] },
  proposals: { marked: [], unmarked: [] },
  votes: { marked: [], unmarked: [] },
  bounties: { marked: [], unmarked: [] },
  forum: { marked: [], unmarked: [] }
};
