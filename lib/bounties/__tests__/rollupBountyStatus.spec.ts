
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { rollupBountyStatus } from '../rollupBountyStatus';

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

  it('should leave a bounty with suggestion status unchanged', async () => {
    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'suggestion'
    });

    const bountyAfterRollup = await rollupBountyStatus(bounty.id);

    expect(bountyAfterRollup.status).toBe('suggestion');
  });

});

