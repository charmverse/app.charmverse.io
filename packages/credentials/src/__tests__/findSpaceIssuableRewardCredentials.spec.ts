import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsCredentials } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import {
  generateBounty,
  generateBountyApplication,
  generateBountyWithSingleApplication
} from '@packages/testing/setupDatabase';
import { randomETHWallet } from '@packages/utils/blockchain';
import { pseudoRandomHexString } from '@packages/utils/random';
import { getSubmissionPagePermalink } from '@root/lib/pages/getPagePermalink';
import { v4 as uuid } from 'uuid';

import { rewardSubmissionApprovedVerb } from '../constants';
import type { IssuableRewardApplicationCredentialContent } from '../findIssuableRewardCredentials';
import { findSpaceIssuableRewardCredentials } from '../findIssuableRewardCredentials';

describe('findSpaceIssuableRewardCredentials', () => {
  it('should only return issuable credentials for a specific reward or application if this is provided', async () => {
    const authorWalletAddress = randomETHWallet().address;
    const { space, user: author } = await testUtilsUser.generateUserAndSpace({ wallet: authorWalletAddress });

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved'],
      schemaType: 'reward',
      schemaAddress: '0x1234',
      description: 'Description 1',
      name: 'Template 1',
      organization: 'Org 1'
    });

    const rewardWithApplication = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: author.id,
      selectedCredentialTemplateIds: [credentialTemplate.id]
    });

    const firstApplication = rewardWithApplication.applications[0];

    const secondApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: rewardWithApplication.id,
      spaceId: space.id,
      userId: author.id
    });

    const secondRewardWithApplication = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: author.id,
      selectedCredentialTemplateIds: [credentialTemplate.id]
    });

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });

    // 1 author * 1 credential template * (2 applications + 1 application) = 3 credentials
    expect(result).toHaveLength(3);

    const expectedFirstRewardApplicationCredential: IssuableRewardApplicationCredentialContent = {
      recipientUserId: author.id,
      recipientAddress: authorWalletAddress,
      credentialTemplateId: credentialTemplate.id,
      event: 'reward_submission_approved',
      rewardApplicationId: firstApplication.id,
      rewardId: rewardWithApplication.id,
      rewardPageId: rewardWithApplication.page.id,
      credential: {
        Description: credentialTemplate.description,
        Name: credentialTemplate.name,
        Organization: credentialTemplate.organization,
        Event: `Reward submission ${rewardSubmissionApprovedVerb}`,
        rewardURL: getSubmissionPagePermalink({ submissionId: firstApplication.id })
      }
    } as IssuableRewardApplicationCredentialContent;

    const expectedFirstRewardSecondApplicationCredential: IssuableRewardApplicationCredentialContent = {
      recipientUserId: author.id,
      recipientAddress: authorWalletAddress,
      credentialTemplateId: credentialTemplate.id,
      event: 'reward_submission_approved',
      rewardApplicationId: secondApplication.id,
      rewardId: rewardWithApplication.id,
      rewardPageId: rewardWithApplication.page.id,
      credential: {
        Description: credentialTemplate.description,
        Name: credentialTemplate.name,
        Organization: credentialTemplate.organization,
        Event: `Reward submission ${rewardSubmissionApprovedVerb}`,
        rewardURL: getSubmissionPagePermalink({ submissionId: secondApplication.id })
      }
    } as IssuableRewardApplicationCredentialContent;

    const expectedSecondRewardApplicationCredential: IssuableRewardApplicationCredentialContent = {
      recipientUserId: author.id,
      recipientAddress: authorWalletAddress,
      credentialTemplateId: credentialTemplate.id,
      event: 'reward_submission_approved',
      rewardApplicationId: secondRewardWithApplication.applications[0].id,
      rewardId: secondRewardWithApplication.id,
      rewardPageId: secondRewardWithApplication.page.id,
      credential: {
        Description: credentialTemplate.description,
        Name: credentialTemplate.name,
        Organization: credentialTemplate.organization,
        Event: `Reward submission ${rewardSubmissionApprovedVerb}`,
        rewardURL: getSubmissionPagePermalink({ submissionId: secondRewardWithApplication.applications[0].id })
      }
    } as IssuableRewardApplicationCredentialContent;

    expect(result).toMatchObject(
      expect.arrayContaining<IssuableRewardApplicationCredentialContent>([
        expectedFirstRewardApplicationCredential,
        expectedFirstRewardSecondApplicationCredential,
        expectedSecondRewardApplicationCredential
      ])
    );

    const resultWithSelectedRewardId = await findSpaceIssuableRewardCredentials({
      spaceId: space.id,
      rewardIds: [rewardWithApplication.id]
    });

    expect(resultWithSelectedRewardId).toHaveLength(2);

    expect(resultWithSelectedRewardId).toMatchObject(
      expect.arrayContaining<IssuableRewardApplicationCredentialContent>([
        expectedFirstRewardApplicationCredential,
        expectedFirstRewardSecondApplicationCredential
      ])
    );

    const resultWithSelectedApplicationId = await findSpaceIssuableRewardCredentials({
      spaceId: space.id,
      applicationId: secondApplication.id
    });

    expect(resultWithSelectedApplicationId).toHaveLength(1);

    expect(resultWithSelectedApplicationId).toMatchObject(
      expect.arrayContaining<IssuableRewardApplicationCredentialContent>([
        expectedFirstRewardSecondApplicationCredential
      ])
    );
  });
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
        credentialType: 'reward',
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

  it('should filter out credentials that were already issued onchain', async () => {
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

    const result = await findSpaceIssuableRewardCredentials({ spaceId: space.id });
    expect(result.length).toBe(1);

    // Simulate having issued this credential already
    await testUtilsCredentials.generateIssuedOnchainCredential({
      credentialEvent: 'reward_submission_approved',
      credentialTemplateId: credentialTemplate.id,
      rewardApplicationId: rewardApplication.id,
      userId: user.id
    });

    const resultAfterIssuedCredentialSaved = await findSpaceIssuableRewardCredentials({ spaceId: space.id });

    expect(resultAfterIssuedCredentialSaved).toHaveLength(0);
  });
});
