
import type { Bounty, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { InvalidInputError, PositiveNumbersOnlyError } from '../../utilities/errors';
import { createBounty } from '../createBounty';
import type { UpdateableBountyFields } from '../interfaces';
import { updateBountySettings } from '../updateBountySettings';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('updateBountySettings', () => {

  it("should be able to update 'title' | 'descriptionNodes' | 'description' | 'reviewer' | 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions'", async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      // Different values from what will be updated
      approveSubmitters: true,
      chainId: 2,
      maxSubmissions: 3,
      rewardAmount: 4,
      rewardToken: 'ETH'
    });

    const newContent: UpdateableBountyFields = {
      approveSubmitters: false,
      chainId: 1,
      maxSubmissions: 30,
      rewardAmount: 40,
      rewardToken: 'BNB'
    };

    const updatedBounty = await updateBountySettings({
      bountyId: bounty.id,
      updateContent: newContent
    });

    (Object.keys(newContent) as (keyof UpdateableBountyFields)[]).forEach(key => {
      if (key !== 'permissions') {
        expect(updatedBounty[key]).toBe(newContent[key]);
      }
    });

  });

  it('should not be able to update the status', async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'suggestion'
    });

    const newContent: Partial<Bounty> = {
      status: 'complete'
    };

    const updatedBounty = await updateBountySettings({
      bountyId: bounty.id,
      updateContent: newContent
    });

    expect(updatedBounty.status).toBe('suggestion');

  });

  it('should fail is a null or number equal or below 0 is given for the reward amount', async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'suggestion'
    });

    const newContent: Partial<Bounty> = {
      rewardAmount: null as any
    };

    try {
      await updateBountySettings({
        bountyId: bounty.id,
        updateContent: newContent
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(PositiveNumbersOnlyError);
    }

    newContent.rewardAmount = 0;

    try {
      await updateBountySettings({
        bountyId: bounty.id,
        updateContent: newContent
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(PositiveNumbersOnlyError);
    }

    newContent.rewardAmount = -10;

    try {
      await updateBountySettings({
        bountyId: bounty.id,
        updateContent: newContent
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(PositiveNumbersOnlyError);
    }

  });

  it('should fail if the new cap would be lower than the current valid amount of submissions', async () => {

    const bounty = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      bountyCap: 2,
      applicationStatus: 'review'
    });

    try {
      await updateBountySettings({
        bountyId: bounty.id,
        updateContent: {
          maxSubmissions: 0
        }
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

});

