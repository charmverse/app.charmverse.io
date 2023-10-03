import { v4 as uuid } from 'uuid';

import { createApplication } from 'lib/applications/actions';
import { generateUserAndSpaceWithApiToken, generateBounty } from 'testing/setupDatabase';

import { BountyActionConversionRecord } from '../getBountyAction';
import { getBountyTasks } from '../getBountyTasks';

describe('getBountyTasks', () => {
  it('Should not return any task when there is no action', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const inProgressBounty = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty2',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const application = await createApplication({
      bountyId: inProgressBounty.id,
      message: 'My application message',
      userId: user.id
    });

    const bountyTasks = await getBountyTasks(user.id);

    expect(bountyTasks.unmarked).toEqual([]);
  });

  it('Should not get bounties if user does not have permissions', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty2',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'view'
        }
      ]
    });

    const bountyTasks = await getBountyTasks(user.id);

    expect(bountyTasks.unmarked.length).toEqual(0);
  });

  it('Should only return 2 bounties with 2 different actions for one applicant', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(); // Applicant
    const { user: user2 } = await generateUserAndSpaceWithApiToken(); // Reviewer

    const inProgressBounty = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user2.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const inProgressBounty2 = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user2.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty2',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const application = await createApplication({
      bountyId: inProgressBounty.id,
      message: 'My application message',
      userId: user.id,
      status: 'inProgress'
    });

    const application2 = await createApplication({
      bountyId: inProgressBounty2.id,
      message: 'My application message',
      userId: user.id,
      status: 'rejected'
    });

    const bountyTasks = await getBountyTasks(user.id);

    expect(bountyTasks.unmarked).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          status: inProgressBounty.status,
          type: 'application.accepted',
          taskId: `${inProgressBounty.id}.${application.id}.${BountyActionConversionRecord['application.accepted']}`
        }),
        expect.objectContaining({
          status: inProgressBounty2.status,
          type: 'application.rejected',
          taskId: `${inProgressBounty2.id}.${application2.id}.${BountyActionConversionRecord['application.rejected']}`
        })
      ])
    );
  });

  it('Should only return 2 bounties with 2 different actions for one reviewer', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(); // Reviewer
    const { user: user2 } = await generateUserAndSpaceWithApiToken(); // Applicant

    const inProgressBounty = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty',
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const inProgressBounty2 = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user.id,
      status: 'complete',
      approveSubmitters: false,
      title: 'My new bounty2',
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const application = await createApplication({
      bountyId: inProgressBounty.id,
      message: 'My application message',
      userId: user2.id,
      status: 'review'
    });

    const application2 = await createApplication({
      bountyId: inProgressBounty2.id,
      message: 'My application message',
      userId: user2.id,
      status: 'complete'
    });

    const bountyTasks = await getBountyTasks(user.id);

    expect(bountyTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: inProgressBounty.status,
          type: 'application.submitted',
          taskId: `${inProgressBounty.id}.${application.id}.${BountyActionConversionRecord['application.submitted']}`
        }),
        expect.objectContaining({
          status: inProgressBounty2.status,
          type: 'application.payment_pending',
          taskId: `${inProgressBounty2.id}.${application2.id}.${BountyActionConversionRecord['application.payment_pending']}`
        })
      ])
    );
  });

  it('Should only return 1 suggested bounty', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(); // Applicant
    const { user: user2 } = await generateUserAndSpaceWithApiToken(); // Reviewer

    const inProgressBounty = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user2.id,
      status: 'suggestion',
      approveSubmitters: false,
      title: 'My new bounty',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const application = await createApplication({
      bountyId: inProgressBounty.id,
      message: 'My application message',
      userId: user.id,
      status: 'applied'
    });

    const bountyTasks = await getBountyTasks(user.id);

    expect(bountyTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: inProgressBounty.status,
          type: 'suggestion.created',
          taskId: `${inProgressBounty.id}.${application.id}.${BountyActionConversionRecord['suggestion.created']}`
        })
      ])
    );
  });
});
