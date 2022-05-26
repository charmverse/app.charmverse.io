
import { Bounty, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError, LimitReachedError, PositiveNumbersOnlyError, DuplicateDataError, StringTooShortError } from 'lib/utilities/errors';
import { createBounty, updateBountySettings } from 'lib/bounties';
import { createApplication } from '../createApplication';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../../shared';
import { approveApplication } from '../approveApplication';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('approveApplication', () => {

  it('should allow a bounty reviewer to approve an application', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id,
      reviewer: user.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    await approveApplication({
      userId: user.id,
      applicationOrApplicationId: application
    });

  });

  it('should allow a space admin to approve an application', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id,
      // Random person
      reviewer: v4()
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    await approveApplication({
      userId: user.id,
      applicationOrApplicationId: application
    });

  });

  it('should fail to approve the application if the user is not a reviewer or space admin', async () => {

    const { user: nonAdminUser, space: nonAdminSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: nonAdminUser.id,
      spaceId: nonAdminSpace.id,
      // Random person
      reviewer: null
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    try {
      await approveApplication({
        userId: nonAdminUser.id,
        applicationOrApplicationId: application
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(UnauthorisedActionError);
    }

  });

  it('should fail to approve the application if the limit of active submissions has been reached', async () => {

    const { user: adminUser, space: adminSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: adminUser.id,
      spaceId: adminSpace.id,
      // Random person
      reviewer: null
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: adminUser.id
    });

    await updateBountySettings({
      bountyId: bounty.id,
      updateContent: {
        maxSubmissions: 0
      }
    });

    try {
      await approveApplication({
        userId: adminUser.id,
        applicationOrApplicationId: application
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(LimitReachedError);
    }

  });

});

