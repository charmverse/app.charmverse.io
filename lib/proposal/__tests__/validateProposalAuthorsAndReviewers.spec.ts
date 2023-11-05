import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import type { ProposalUsersValidationResult } from '../validateProposalAuthorsAndReviewers';
import { validateProposalAuthorsAndReviewers } from '../validateProposalAuthorsAndReviewers';

// Space we are testing
let space: Space;
let user: User;
let role: Role;

// Outside space
let outsideSpace: Space;
let outsideUser: User;
let outsideRole: Role;
beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({});
  user = generated.user;
  space = generated.space;
  role = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });

  const outside = await testUtilsUser.generateUserAndSpace({});
  outsideUser = outside.user;
  outsideSpace = outside.space;
  outsideRole = await testUtilsMembers.generateRole({
    createdBy: outsideUser.id,
    spaceId: outsideSpace.id
  });
});

describe('validateProposalAuthorsAndReviewers', () => {
  it('should return valid if all authors and reviewers are valid', async () => {
    const result = await validateProposalAuthorsAndReviewers({
      spaceId: space.id,
      authors: [user.id],
      reviewers: [
        { group: 'user', id: user.id },
        { group: 'role', id: role.id }
      ]
    });

    expect(result).toMatchObject<ProposalUsersValidationResult>({
      valid: true,
      invalidAuthors: [],
      invalidReviewers: []
    });
  });

  it('should return invalid if some authors and reviewers are invalid as well as their information', async () => {
    const result = await validateProposalAuthorsAndReviewers({
      spaceId: space.id,
      authors: [user.id, outsideUser.id],
      reviewers: [
        { group: 'user', id: user.id },
        { group: 'role', id: role.id },
        { group: 'user', id: outsideUser.id },
        { group: 'role', id: outsideRole.id }
      ]
    });

    expect(result.invalidAuthors).toHaveLength(1);
    expect(result.invalidReviewers).toHaveLength(2);

    expect(result).toMatchObject<ProposalUsersValidationResult>({
      valid: false,
      invalidAuthors: expect.arrayContaining([outsideUser.id]),
      invalidReviewers: expect.arrayContaining<TargetPermissionGroup<'role' | 'user'>>([
        { group: 'user', id: outsideUser.id },
        { group: 'role', id: outsideRole.id }
      ])
    });
  });
});
