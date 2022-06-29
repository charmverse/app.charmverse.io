
import { Bounty, Space, User } from '@prisma/client';
import { InvalidInputError } from 'lib/utilities/errors/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { queryBountyPermissions } from '../../permissions/bounties';
import { PositiveNumbersOnlyError } from '../../utilities/errors/numbers';
import { createBounty } from '../createBounty';
import { BountyCreationData } from '../interfaces';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('createBounty', () => {

  it('should be able to create a bounty suggestion with only a title, createdBy, spaceId and status, and record who suggested the bounty', async () => {

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(bounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        title: expect.stringContaining('My bounty'),
        description: expect.any(String),
        createdBy: expect.stringContaining(user.id),
        spaceId: expect.stringContaining(space.id),
        suggestedBy: expect.stringContaining(user.id)
      })
    );

  });

  it('should accept as creation input: title, spaceId, createdBy, status, chainId, description, descriptionNodes, approveSubmitters, maxSubmissions, rewardAmount, rewardToken, reviewer, linkedTaskId, permissions', async () => {

    const fullBountyCreationData: BountyCreationData = {
      createdBy: user.id,
      spaceId: space.id,
      title: 'Testing this works',
      approveSubmitters: true,
      chainId: 1,
      description: 'Example description',
      descriptionNodes: '{type:"doc"}',
      linkedTaskId: v4(),
      maxSubmissions: 100,
      reviewer: user.id,
      rewardAmount: 1000,
      rewardToken: 'ETH',
      status: 'suggestion',
      permissions: {
        submitter: [{ group: 'space', id: space.id }]
      }
    };

    const bounty = await createBounty(fullBountyCreationData);

    Object.entries(fullBountyCreationData).forEach(([key, value]) => {

      if (key !== 'permissions') {
        expect(bounty[key as Exclude<keyof BountyCreationData, 'permissions'>]).toBe(value);
      }

    });

    const bountyPermissions = await queryBountyPermissions({ bountyId: bounty.id });

    // Make sure permission was inserted correctly
    expect(bountyPermissions.submitter.some(p => p.group === 'space' && p.id === space.id)).toBe(true);

    // Make sure synthetic permission is applied
    expect(bountyPermissions.creator.some(p => p.group === 'user' && user.id === bounty.createdBy)).toBe(true);
    const { reviewer, viewer } = bountyPermissions;

    // Make sure nothing unexpected was added
    expect(reviewer.length + viewer.length).toBe(0);

  });

  it('should be able to create a bounty in open status if the data provided has at least title, createdBy, spaceId, status and rewardAmount', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const bounty = await createBounty({
      title: 'My bounty',
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      status: 'open',
      rewardAmount: 1
    });

    expect(bounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        title: expect.stringContaining('My bounty'),
        description: expect.any(String),
        createdBy: expect.stringContaining(adminUser.id),
        spaceId: expect.stringContaining(localSpace.id)
      })
    );

  });

  it('should fail to create an open bounty if the reward amount is 0 and status is open', async () => {

    const { user: localUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    try {

      await createBounty({
        title: 'My bounty',
        createdBy: localUser.id,
        spaceId: localSpace.id,
        rewardAmount: 0,
        status: 'open'
      });

      throw new ExpectedAnError();

    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail to create a bounty if the reward amount is negative', async () => {

    const { user: localUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    try {

      await createBounty({
        title: 'My bounty',
        createdBy: localUser.id,
        spaceId: localSpace.id,
        rewardAmount: -10,
        status: 'open'
      });

      throw new ExpectedAnError();

    }
    catch (error) {
      expect(error).toBeInstanceOf(PositiveNumbersOnlyError);
    }

  });

});

