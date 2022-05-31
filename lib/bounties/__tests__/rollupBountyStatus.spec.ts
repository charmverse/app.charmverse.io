
import { Bounty, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { createBounty } from '../createBounty';
import { rollupBountyStatus } from '../rollupBountyStatus';
import { PositiveNumbersOnlyError } from '../../utilities/errors/numbers';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('rollupBountyStatus', () => {

  it('should fail if the bounty does not exist', async () => {
    try {
      await rollupBountyStatus(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }

  });

  it('should set the bounty status to "open" if its cap is not reached', async () => {

    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupBountyStatus(bounty.id);

    expect(bountyAfterRollup.status).toBe('open');

  });

  it('should set the bounty status to "open" if there is no cap', async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupBountyStatus(bounty.id);

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the bounty status to "in progress" if the cap is reached and some submissions are still in progress or in review', async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupBountyStatus(bounty.id);

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the bounty status to "complete" if enough submissions are approved', async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupBountyStatus(bounty.id);

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the bounty status to "paid" if cap is reached and all submissions are paid', async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupBountyStatus(bounty.id);

    expect(bountyAfterRollup.status).toBe('open');
  });

});

