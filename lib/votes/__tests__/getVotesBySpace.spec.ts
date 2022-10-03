import { upsertPermission } from 'lib/permissions/pages';
import { createPage, createVote, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getVotesBySpace } from '../getVotesBySpace';

describe('getVotesBySpace', () => {
  it('should get all votes of a space for an admin user', async () => {
    const { space, user: accessibleSpaceUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const { space: inaccessibleSpace, user: inaccessibleSpaceUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const [accessibleSpacePage, inaccessibleSpacePage] = await Promise.all([
      createPage({
        createdBy: accessibleSpaceUser.id,
        spaceId: space.id
      }),
      createPage({
        createdBy: inaccessibleSpaceUser.id,
        spaceId: inaccessibleSpace.id
      })
    ]);

    const [accessibleSpacePageVote] = await Promise.all([
      createVote({
        pageId: accessibleSpacePage.id,
        createdBy: accessibleSpaceUser.id,
        spaceId: space.id,
        voteOptions: ['1', '2'],
        userVotes: ['1']
      }),
      createVote({
        pageId: inaccessibleSpacePage.id,
        createdBy: inaccessibleSpaceUser.id,
        spaceId: inaccessibleSpace.id,
        voteOptions: ['1', '2'],
        userVotes: ['1']
      })
    ]);

    const votes = await getVotesBySpace({ spaceId: space.id, userId: accessibleSpaceUser.id });
    expect(votes.length).toBe(1);
    expect(votes[0].id).toBe(accessibleSpacePageVote.id);
  });

  it('should get votes of a space linked to pages a non admin user can access', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: space.id
    });

    const [accessiblePage, inaccessiblePage] = await Promise.all([
      createPage({
        createdBy: adminUser.id,
        spaceId: space.id
      }),
      createPage({
        createdBy: adminUser.id,
        spaceId: space.id
      })
    ]);

    await upsertPermission(accessiblePage.id, {
      permissionLevel: 'full_access',
      userId: nonAdminUser.id
    });

    const [accessibleVote1] = await Promise.all([
      createVote({
        pageId: accessiblePage.id,
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        voteOptions: ['1', '2'],
        userVotes: ['1']
      }),
      createVote({
        pageId: inaccessiblePage.id,
        createdBy: adminUser.id,
        spaceId: space.id,
        voteOptions: ['1', '2'],
        userVotes: ['1']
      })
    ]);

    const votes = await getVotesBySpace({ spaceId: space.id, userId: nonAdminUser.id });
    expect(votes.length).toBe(1);
    expect(votes[0].id).toBe(accessibleVote1.id);
  });
});
