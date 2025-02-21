import { ApplicationStatus, prisma } from '@charmverse/core/prisma-client';
import { isStagingEnv, isTestEnv } from '@root/config/constants';
import { testUtilsUser } from '@charmverse/core/test';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import { stringUtils } from '@charmverse/core/utilities';
import { randomName } from '@packages/utils/randomName';

export async function generateRewardApplications({
  rewardPagePathOrId,
  amount,
  status
}: {
  rewardPagePathOrId: string;
  amount: number;
  status: ApplicationStatus;
}) {
  if (!isTestEnv && !isStagingEnv) {
    throw new Error('This script cannot be used in production');
  }

  const { spaceId, id } = await prisma.page.findFirstOrThrow({
    where: stringUtils.isUUID(rewardPagePathOrId)
      ? {
          id: rewardPagePathOrId
        }
      : {
          path: rewardPagePathOrId
        },
    select: {
      id: true,
      spaceId: true
    }
  });

  for (let i = 0; i < amount; i++) {
    const spaceUser = await testUtilsUser.generateSpaceUser({
      spaceId
    });

    await prisma.user.update({
      where: {
        id: spaceUser.id
      },
      data: {
        username: randomName()
      }
    });
    await prisma.application.create({
      data: {
        spaceId,
        status,
        bounty: { connect: { id } },
        applicant: { connect: { id: spaceUser.id } },
        message: 'Applying because I can do really well on this reward',
        submission: 'This is my contribution',
        submissionNodes: JSON.stringify(stubProsemirrorDoc({ text: 'This is my contribution' }))
      }
    });

    console.log('Generated app ', i + 1, '/', amount, 'with status', status);
  }
}

const rewardId = 'a3255f85-dcee-446c-9e0e-cf256d06360d';

generateRewardApplications({
  amount: 12,
  status: 'applied',
  rewardPagePathOrId: rewardId
}).then(() => console.log('Done'));

generateRewardApplications({
  amount: 6,
  status: 'inProgress',
  rewardPagePathOrId: rewardId
}).then(() => console.log('Done'));

generateRewardApplications({
  amount: 5,
  status: 'review',
  rewardPagePathOrId: rewardId
}).then(() => console.log('Done'));

generateRewardApplications({
  amount: 4,
  status: 'complete',
  rewardPagePathOrId: rewardId
}).then(() => console.log('Done'));
