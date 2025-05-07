import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { addOrangeDaoMembersAndCreateNotifications } from 'scripts/addOrangeDaoMembersAndCreateNotifications';
import { v4 } from 'uuid';

describe.skip('addOrangeDaoMembersAndCreateNotifications', () => {
  it('Should create space roles and notifications for sampled users', async () => {
    const { space: testSpace, user: testSpaceAdmin } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const homePage = await testUtilsPages.generatePage({
      createdBy: testSpaceAdmin.id,
      spaceId: testSpace.id
    });

    const [
      { space: grantsSpace1, user: grantsSpace1User1 },
      { space: grantsSpace2, user: grantsSpace2User1 },
      { space: grantsSpace3, user: grantsSpace3User1 }
    ] = await Promise.all(
      new Array(3).fill(null).map(() =>
        testUtilsUser.generateUserAndSpace({
          user: {
            email: `${v4()}@test.com`
          }
        })
      )
    );

    const [grantsSpace1User2, grantsSpace2User2, grantsSpace3User2] = await Promise.all([
      testUtilsUser.generateSpaceUser({
        spaceId: grantsSpace1.id
      }),
      testUtilsUser.generateSpaceUser({
        spaceId: grantsSpace2.id
      }),
      testUtilsUser.generateSpaceUser({
        spaceId: grantsSpace3.id
      })
    ]);

    // Adding grants space 1 user to grants space 2
    await prisma.spaceRole.create({
      data: {
        userId: grantsSpace3User1.id,
        spaceId: grantsSpace2.id
      }
    });

    await Promise.all([
      prisma.user.update({
        where: {
          id: grantsSpace1User2.id
        },
        data: {
          email: `${v4()}@test.com`
        }
      }),
      prisma.user.update({
        where: {
          id: grantsSpace3User2.id
        },
        data: {
          email: `${v4()}@test.com`
        }
      })
    ]);

    await Promise.all([
      testUtilsProposals.generateProposal({
        proposalStatus: 'published',
        spaceId: grantsSpace1.id,
        userId: grantsSpace1User1.id,
        authors: [grantsSpace1User1.id]
      }),
      testUtilsProposals.generateProposal({
        proposalStatus: 'published',
        spaceId: grantsSpace1.id,
        userId: grantsSpace1User2.id,
        authors: [grantsSpace1User2.id]
      }),
      testUtilsProposals.generateProposal({
        proposalStatus: 'draft',
        spaceId: grantsSpace2.id,
        userId: grantsSpace2User1.id,
        authors: [grantsSpace2User1.id]
      }),
      // Grants space 3 user 1 creates a proposal in grants space 2
      testUtilsProposals.generateProposal({
        proposalStatus: 'published',
        spaceId: grantsSpace2.id,
        userId: grantsSpace3User1.id,
        authors: [grantsSpace1User1.id]
      }),
      testUtilsProposals.generateProposal({
        proposalStatus: 'published',
        spaceId: grantsSpace3.id,
        userId: grantsSpace3User1.id,
        authors: [grantsSpace3User1.id]
      })
    ]);

    const spaceDomains = [grantsSpace1.domain, grantsSpace2.domain, grantsSpace3.domain];

    await addOrangeDaoMembersAndCreateNotifications({
      spaceDomains,
      sample: 2,
      homePagePath: homePage.path
    });

    const [
      testSpaceGrantsSpace1User1SpaceRole,
      testSpaceGrantsSpace1User2SpaceRole,
      testSpaceGrantsSpace2User1SpaceRole,
      testSpaceGrantsSpace2User2SpaceRole,
      testSpaceGrantsSpace3User1SpaceRole,
      testSpaceGrantsSpace3User2SpaceRole
    ] = await Promise.all([
      prisma.spaceRole.findFirst({
        where: {
          userId: grantsSpace1User1.id,
          spaceId: testSpace.id
        }
      }),
      prisma.spaceRole.findFirst({
        where: {
          userId: grantsSpace1User2.id,
          spaceId: testSpace.id
        }
      }),
      prisma.spaceRole.findFirst({
        where: {
          userId: grantsSpace2User1.id,
          spaceId: testSpace.id
        }
      }),
      prisma.spaceRole.findFirst({
        where: {
          userId: grantsSpace2User2.id,
          spaceId: testSpace.id
        }
      }),
      prisma.spaceRole.findFirst({
        where: {
          userId: grantsSpace3User1.id,
          spaceId: testSpace.id
        }
      }),
      prisma.spaceRole.findFirst({
        where: {
          userId: grantsSpace3User2.id,
          spaceId: testSpace.id
        }
      })
    ]);

    // Only a single user from grants space 1 will be invited due to sample constraint
    expect(
      [Boolean(testSpaceGrantsSpace1User1SpaceRole), Boolean(testSpaceGrantsSpace1User2SpaceRole)].sort()
    ).toStrictEqual([false, true]);

    // No user will be invited from grants space 2, since one user only has draft proposal and the other has no email
    expect(
      [Boolean(testSpaceGrantsSpace2User1SpaceRole), Boolean(testSpaceGrantsSpace2User2SpaceRole)].sort()
    ).toStrictEqual([false, false]);

    // Only a single user from grants space 3 will be invited since only a single publish proposal exist in that space
    expect([Boolean(testSpaceGrantsSpace3User1SpaceRole), Boolean(testSpaceGrantsSpace3User2SpaceRole)]).toStrictEqual([
      true,
      false
    ]);
  });
});
