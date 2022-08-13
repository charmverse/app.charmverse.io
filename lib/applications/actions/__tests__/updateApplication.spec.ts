
import { Application, Bounty, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError, LimitReachedError, PositiveNumbersOnlyError, DuplicateDataError, StringTooShortError } from 'lib/utilities/errors';
import { createBounty } from 'lib/bounties/createBounty';
import { createApplication } from '../createApplication';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../../shared';
import { updateApplication } from '../updateApplication';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('updateApplication', () => {

  it('should only update the application message', async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    // Generate an object with same keys and random data
    const randomData = Object.keys(application).reduce((obj: any, key) => {
      obj[key] = Math.random();
      return obj;
    }, {});

    const newMessage = 'This is the new message';

    const updated = await updateApplication({
      ...randomData,
      applicationId: application.id,
      message: newMessage
    });

    // Make sure nothing changed
    (Object.entries(updated)).forEach(entry => {

      const [key, updatedValue] = entry;

      if (key !== 'message') {
        expect(updatedValue).toEqual(application[key as keyof Application]);
      }

    });

    expect(updated.message).toBe(newMessage);

  });

  it(`should fail if the new message has less than ${MINIMUM_APPLICATION_MESSAGE_CHARACTERS} characters`, async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    try {
      await updateApplication({
        applicationId: application.id,
        message: ''
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(StringTooShortError);
    }

  });

  it('should fail if the application does not exist', async () => {

    try {
      await updateApplication({
        applicationId: v4(),
        message: 'A valid application message'
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }

  });

});

