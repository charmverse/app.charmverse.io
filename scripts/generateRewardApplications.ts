import { ApplicationStatus, prisma } from "@charmverse/core/prisma-client";
import { isTestEnv } from "config/constants";
import {testUtilsUser} from '@charmverse/core/test'
import { stubProsemirrorDoc } from "testing/stubs/pageContent";
import { stringUtils } from "@charmverse/core/utilities";





export async function generateRewardApplications({rewardPagePathOrId, amount, status}: {rewardPagePathOrId: string, amount: number, status: ApplicationStatus}) {
  if (!isTestEnv) {
    throw new Error('This script cannot be used in production')
  }

  const {spaceId, id} = await prisma.page.findFirstOrThrow({
    where: stringUtils.isUUID(rewardPagePathOrId) ? {
      id: rewardPagePathOrId
    } : {
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
    await prisma.application.create({
      data: {
        spaceId,
        status,
        bounty: {connect: {id}},
        applicant: {connect: {id: spaceUser.id}},
        message: 'Applying because I can do really well on this reward',
        submission: 'This is my contribution',
        submissionNodes: JSON.stringify(stubProsemirrorDoc({text: 'This is my contribution'}))
      }
    })
  }
}

// generateRewardApplications({
//   amount: 15,
//   status: 'review',
//   rewardPagePathOrId: "106934ad-9c71-492c-82c2-4e2bfe0491dd"
// }).then(() => console.log('Done'))