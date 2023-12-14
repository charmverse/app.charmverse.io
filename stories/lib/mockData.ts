import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import type { Member, MemberPropertyWithPermissions, PropertyValueWithDetails } from 'lib/members/interfaces';
import { generateDefaultProposalCategoriesInput } from 'lib/proposal/generateDefaultProposalCategoriesInput';
import { getDefaultWorkflows } from 'lib/proposal/workflows/defaultWorkflows';
import type { LoggedInUser } from 'models/User';
import { createMemberProperty, createMemberPropertyValue } from 'testing/mocks/memberProperty';
import { createMockSpace } from 'testing/mocks/space';
import { createMockSpaceMember } from 'testing/mocks/spaceMember';
import { createMockUser } from 'testing/mocks/user';
import { brandColorNames } from 'theme/colors';

import type { ListSpaceRolesResponse } from '../../pages/api/roles/index';

const userProfileSeed = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10';

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

export const memberPropertyTypes = [
  'profile_pic',
  'role',
  'bio',
  'discord',
  'twitter',
  'linked_in',
  'github',
  'timezone',
  'join_date'
] as const;

// use cvt- in domain so that feature flags are enabled
export const spaces = [createMockSpace({ id: seeds[0], domain: `cvt-${seeds[0]}` })];

export const memberProperties: MemberPropertyWithPermissions[] = memberPropertyTypes.map((type, index) => {
  const memberProperty = createMemberProperty({
    index,
    name: type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    type,
    spaceId: spaces[0].id,
    updatedBy: seeds[0],
    createdBy: seeds[0]
  });

  return {
    ...memberProperty,
    permissions: []
  };
});

// user profile with space role
export const userProfile = {
  ...createMockUser({ id: userProfileSeed }),
  spaceRoles: [{ spaceId: spaces[0].id, isAdmin: true }]
} as LoggedInUser;
const userSpaceMember = createMockSpaceMember(userProfile);
export const userMemberProfile: Member = {
  ...userSpaceMember,
  properties: memberProperties.map((property) => ({
    enabledViews: property.enabledViews,
    memberPropertyId: property.id,
    name: property.name,
    spaceId: property.spaceId,
    type: property.type,
    value: createMemberPropertyValue(userSpaceMember, property.type)
  })) as PropertyValueWithDetails[]
};

export const members: Member[] = seeds.map((seed) => {
  const member = createMockSpaceMember(createMockUser({ id: seed }));

  const memberWithProperties = {
    ...member,
    properties: memberProperties.map((property) => ({
      enabledViews: property.enabledViews,
      memberPropertyId: property.id,
      name: property.name,
      spaceId: property.spaceId,
      type: property.type,
      value: createMemberPropertyValue(member, property.type)
    })) as PropertyValueWithDetails[]
  };
  return memberWithProperties;
});

export const spaceRoles: ListSpaceRolesResponse[] = [
  { id: '1', name: 'Moderator', spacePermissions: [], source: null },
  { id: '2', name: 'Grant Reviewer', spacePermissions: [], source: null }
];

export const proposalCategories: ProposalCategoryWithPermissions[] = generateDefaultProposalCategoriesInput(
  'space-id'
).map((cat, i) => ({
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
