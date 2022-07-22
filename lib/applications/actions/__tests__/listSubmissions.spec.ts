import { ApplicationStatus, Space, User } from '@prisma/client';
import { generateBountyWithSingleApplication, generateSpaceUser, generateTransaction, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { listSubmissions } from '../listAccessibleApplications';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('listSubmissions', () => {

  it('Should only return inProgress, review, complete or paid status submissions (not applied or rejected)', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: user.id,
      bountyStatus: 'open',
      spaceId: space.id
    });

    // There are 6 Application statuses
    await Promise.all((Object.keys(ApplicationStatus) as ApplicationStatus[]).map(status => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async resolve => {

        const _user = await generateSpaceUser({
          isAdmin: false,
          spaceId: space.id
        });

        prisma.application.create(
          {
            data: {
              bounty: {
                connect: {
                  id: bounty.id
                }
              },
              applicant: {
                connect: {
                  id: _user.id
                }
              },
              status,
              spaceId: bounty.spaceId
            }

          }
        ).then(app => resolve(app));
      });
    }));

    const submissionsWithTransaction = await listSubmissions(bounty.id);
    expect(submissionsWithTransaction.length).toBe(4);

    const subStatusApplied = submissionsWithTransaction.find(sub => sub.status === 'applied');
    const subStatusRejected = submissionsWithTransaction.find(sub => sub.status === 'rejected');

    expect(subStatusApplied).toBeUndefined();
    expect(subStatusRejected).toBeUndefined();
  });
  it('Should retrieve transaction for a submission', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: 1,
      userId: user.id,
      bountyStatus: 'open',
      spaceId: space.id
    });

    await generateTransaction({
      applicationId: bounty.applications[0].id
    });

    const submissionsWithTransaction = await listSubmissions(bounty.id);
    expect(submissionsWithTransaction.length).toBe(1);
    expect(submissionsWithTransaction[0].transactions.length).toBe(1);
  });
});
