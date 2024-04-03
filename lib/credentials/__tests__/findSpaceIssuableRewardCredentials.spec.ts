import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsCredentials } from '@charmverse/core/test';
import { use } from 'react';
import { v4 as uuid } from 'uuid';

import { getSubmissionPagePermalink } from 'lib/pages/getPagePermalink';
import { randomETHWallet } from 'lib/utils/blockchain';
import { pseudoRandomHexString } from 'lib/utils/random';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateBounty, generateBountyApplication, generateBountyWithSingleApplication } from 'testing/setupDatabase';

import type { IssuableRewardApplicationCredentialContent } from '../findIssuableRewardCredentials';
import { findSpaceIssuableRewardCredentials } from '../findIssuableRewardCredentials';

describe('findSpaceIssuableRewardCredentials', () => {
  it('should not return credentials  for rewards without selected credential templates', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: user.id
    });

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });
    expect(result).toHaveLength(0);
  });

  it('should return issuable credentials only for complete, processing, or paid applications', async () => {
    const userWallet = randomETHWalletAddress().toLowerCase();

    const { space, user } = await testUtilsUser.generateUserAndSpace({ wallet: userWallet });

    const rewardId = uuid();
    const pageId = uuid();

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved'],
      schemaType: 'reward',
      schemaAddress: '0x1234',
      description: 'Description 1',
      name: 'Template 1',
      organization: 'Org 1'
    });

    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      selectedCredentialTemplates: [credentialTemplate.id],
      id: rewardId,
      customPageId: pageId
    });

    const appliedApp = await generateBountyApplication({
      applicationStatus: 'applied',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const submissionRejectedApp = await generateBountyApplication({
      applicationStatus: 'submission_rejected',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const inProgressApp = await generateBountyApplication({
      applicationStatus: 'inProgress',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const inReviewApp = await generateBountyApplication({
      applicationStatus: 'review',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const rejectedApp = await generateBountyApplication({
      applicationStatus: 'rejected',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const cancelledApp = await generateBountyApplication({
      applicationStatus: 'cancelled',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const processingApp = await generateBountyApplication({
      applicationStatus: 'processing',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const approvedApp = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const paidApp = await generateBountyApplication({
      applicationStatus: 'paid',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });

    // Only generate credentials for complete, processing, or paid applications
    expect(result).toHaveLength(3);

    expect(result).toEqual(
      expect.arrayContaining<IssuableRewardApplicationCredentialContent>([
        {
          credentialTemplateId: credentialTemplate.id,
          recipientAddress: userWallet,
          event: 'reward_submission_approved',
          rewardApplicationId: approvedApp.id,
          recipientUserId: user.id,
          credential: {
            Description: credentialTemplate.description,
            Event: 'Reward submission Approved',
            Name: credentialTemplate.name,
            Organization: credentialTemplate.organization,
            rewardURL: getSubmissionPagePermalink({ submissionId: approvedApp.id })
          },
          rewardPageId: pageId,
          rewardId
        },
        {
          credentialTemplateId: credentialTemplate.id,
          recipientAddress: userWallet,
          event: 'reward_submission_approved',
          rewardApplicationId: processingApp.id,
          recipientUserId: user.id,
          credential: {
            Description: credentialTemplate.description,
            Event: 'Reward submission Approved',
            Name: credentialTemplate.name,
            Organization: credentialTemplate.organization,
            rewardURL: getSubmissionPagePermalink({ submissionId: processingApp.id })
          },
          rewardPageId: pageId,
          rewardId
        },
        {
          credentialTemplateId: credentialTemplate.id,
          recipientAddress: userWallet,
          event: 'reward_submission_approved',
          rewardApplicationId: paidApp.id,
          recipientUserId: user.id,
          credential: {
            Description: credentialTemplate.description,
            Event: 'Reward submission Approved',
            Name: credentialTemplate.name,
            Organization: credentialTemplate.organization,
            rewardURL: getSubmissionPagePermalink({ submissionId: paidApp.id })
          },
          rewardPageId: pageId,
          rewardId
        }
      ])
    );
  });

  it('should filter out credentials if a pending safe transaction references them', async () => {
    const userWallet = randomETHWalletAddress().toLowerCase();
    const { space, user } = await testUtilsUser.generateUserAndSpace({ wallet: userWallet });

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBountyWithSingleApplication({
      bountyCap: null,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id,
      selectedCredentialTemplateIds: [credentialTemplate.id]
    });

    const applicationWithoutPendingTx = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });
    expect(result.length).toBe(2);

    // Simulate a pending transaction that would prevent a new credential issuance
    await prisma.pendingSafeTransaction.create({
      data: {
        // Assuming the structure of your pending transactions table and related content
        spaceId: space.id,
        chainId: 1,
        safeAddress: pseudoRandomHexString(),
        safeTxHash: pseudoRandomHexString(),
        schemaId: pseudoRandomHexString(),
        rewardIds: [reward.id],
        credentialContent: {
          [reward.id]: [
            {
              event: 'reward_submission_approved',
              recipientAddress: userWallet,
              rewardApplicationId: reward.applications[0].id,
              rewardId: reward.id,
              credentialTemplateId: credentialTemplate.id,
              recipientUserId: user.id
            } as IssuableRewardApplicationCredentialContent
          ]
        }
      }
    });

    const resultAfterPendingTx = await findSpaceIssuableRewardCredentials({ spaceId: space.id });
    expect(resultAfterPendingTx).toEqual<IssuableRewardApplicationCredentialContent[]>([
      {
        rewardId: reward.id,
        rewardPageId: reward.page.id,
        rewardApplicationId: applicationWithoutPendingTx.id,
        credentialTemplateId: credentialTemplate.id,
        recipientUserId: user.id,
        recipientAddress: userWallet,
        event: 'reward_submission_approved',
        credential: {
          Name: credentialTemplate.name,
          Description: credentialTemplate.description,
          Organization: credentialTemplate.organization,
          Event: 'Reward submission Approved',
          rewardURL: getSubmissionPagePermalink({ submissionId: applicationWithoutPendingTx.id })
        }
      }
    ]);
  });

  it('should work if there are no applications in a reward', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    // Assume generateBountyWithSingleApplication can create a reward without applications
    await generateBounty({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });
    expect(result.length).toBe(0);
  });

  it('should filter out credentials that were already issued', async () => {
    const userWallet = randomETHWalletAddress().toLowerCase();
    const { space, user } = await testUtilsUser.generateUserAndSpace({ wallet: userWallet });

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved'],
      schemaType: 'reward'
    });

    const reward = await generateBountyWithSingleApplication({
      bountyCap: null,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id,
      selectedCredentialTemplateIds: [credentialTemplate.id]
    });

    const rewardApplication = reward.applications[0];

    const secondRewardApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: user.id
    });

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });
    expect(result.length).toBe(2);

    // Simulate having issued this credential already
    await testUtilsCredentials.generateIssuedCredential({
      credentialEvent: 'reward_submission_approved',
      credentialTemplateId: credentialTemplate.id,
      rewardApplicationId: rewardApplication.id,
      userId: user.id
    });

    const resultAfterPendingTx = await findSpaceIssuableRewardCredentials({ spaceId: space.id });

    expect(resultAfterPendingTx).toEqual<IssuableRewardApplicationCredentialContent[]>([
      {
        rewardId: reward.id,
        credentialTemplateId: credentialTemplate.id,
        event: 'reward_submission_approved',
        rewardPageId: reward.page.id,
        recipientAddress: userWallet,
        recipientUserId: user.id,
        // Important bit, make sure second application is unaffected
        rewardApplicationId: secondRewardApplication.id,
        credential: {
          Description: credentialTemplate.description,
          Event: 'Reward submission Approved',
          Name: credentialTemplate.name,
          Organization: credentialTemplate.organization,
          rewardURL: getSubmissionPagePermalink({ submissionId: secondRewardApplication.id })
        }
      }
    ]);
  });
});
