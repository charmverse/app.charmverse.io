import type { Application, IssuedCredential } from '@charmverse/core/prisma-client';
import { ApplicationStatus, prisma } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';
import { optimism } from 'viem/chains';

import { typedKeys } from 'lib/utils/objects';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateBounty, generateBountyApplication, generateBountyWithSingleApplication } from 'testing/setupDatabase';

import { issueRewardCredentialsIfNecessary } from '../issueRewardCredentialsIfNecessary';
import { publishSignedCredential, type PublishedSignedCredential } from '../queriesAndMutations';
import { attestationSchemaIds } from '../schemas';

jest.mock('lib/credentials/queriesAndMutations', () => ({
  publishSignedCredential: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: optimism.id,
      content: {},
      id: uuid(),
      issuer: '0x66d96dab921F7c8Ce98d0e05fb0B76Db8Bd54773',
      recipient: '0xAEfe164A5f55121AD98d0e347dA7990CcC8BE295',
      schemaId: attestationSchemaIds.reward,
      sig: 'Signature content',
      timestamp: new Date(),
      type: 'reward',
      verificationUrl: 'https://eas-explorer-example.com/verification'
    } as PublishedSignedCredential)
  )
}));

const mockedPublishSignedCredential = jest.mocked(publishSignedCredential);

afterEach(() => {
  mockedPublishSignedCredential.mockClear();
});
describe.skip('issueRewardCredentialIfNecessary', () => {
  it('should issue credentials once for a unique combination of user, reward submission and credential template', async () => {
    const { space, user: rewardCreatorAndSubmitter } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const submitter = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: rewardCreatorAndSubmitter.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id]
    });

    const submitterApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: submitter.id
    });

    const secondSubmitterApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: submitter.id
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    // 1 event types * 2 credential templates * 3 submissions
    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(6);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bounty: {
            id: reward.id
          }
        }
      }
    });

    const creatorApplicationId = reward.applications[0].id;
    const submitterApplicationId = submitterApplication.id;
    const secondSubmitterApplicationId = secondSubmitterApplication.id;

    // 1 event types * 2 credential templates * 3 submissions
    expect(issuedCredentials).toHaveLength(6);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: rewardCreatorAndSubmitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: creatorApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: rewardCreatorAndSubmitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: secondCredentialTemplate.id,
          rewardApplicationId: creatorApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: submitterApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: secondCredentialTemplate.id,
          rewardApplicationId: submitterApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: secondSubmitterApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: secondCredentialTemplate.id,
          rewardApplicationId: secondSubmitterApplicationId
        })
      ])
    );
  });

  it('should target only a specific submission if this parameter is provided credentials once for a unique combination of user, reward submission and credential template', async () => {
    const { space, user: rewardCreatorAndSubmitter } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const submitter = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: rewardCreatorAndSubmitter.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id]
    });

    const submitterApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: submitter.id
    });

    const secondSubmitterApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: submitter.id
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id,
      submissionId: submitterApplication.id
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id,
      submissionId: submitterApplication.id
    });

    // 1 credential template, and 1 submission targeted
    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(1);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bounty: {
            id: reward.id
          }
        }
      }
    });

    const submitterApplicationId = submitterApplication.id;

    // 1 event types * 2 credential templates * 3 submissions
    expect(issuedCredentials).toHaveLength(1);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: submitterApplicationId
        })
      ])
    );
  });

  it('should only issue credentials if the credential template allows issuing credentials for the event', async () => {
    const { space, user: rewardCreatorAndSubmitter } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const submitter = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: []
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: []
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: rewardCreatorAndSubmitter.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id]
    });

    const submitterApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: submitter.id
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bountyId: reward.id
        }
      }
    });
    // 1 event types * 2 credential templates * 2 authors
    expect(issuedCredentials).toHaveLength(0);
  });

  it('should issue credentials for new submitters', async () => {
    const { space, user: rewardCreatorAndSubmitter } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const submitter = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: rewardCreatorAndSubmitter.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id]
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(2);

    const submitterApplication = await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: reward.id,
      spaceId: space.id,
      userId: submitter.id
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    // 2 previous calls + 2 current calls
    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(4);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bountyId: reward.id
        }
      }
    });

    const creatorApplicationId = reward.applications[0].id;
    const submitterApplicationId = submitterApplication.id;

    // 1 event types * 2 credential templates * 2 authors
    expect(issuedCredentials).toHaveLength(4);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: rewardCreatorAndSubmitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: creatorApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: rewardCreatorAndSubmitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: secondCredentialTemplate.id,
          rewardApplicationId: creatorApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: submitterApplicationId
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: secondCredentialTemplate.id,
          rewardApplicationId: submitterApplicationId
        })
      ])
    );
  });

  it('should ignore inexistent selected credentials', async () => {
    const { space, user: rewardCreatorAndSubmitter } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });

    const inexistentCredentialId = uuid();

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: rewardCreatorAndSubmitter.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, inexistentCredentialId]
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(1);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bountyId: reward.id
        }
      }
    });

    // 1 event types * 1 existing credential template * 1 author
    expect(issuedCredentials).toHaveLength(1);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: rewardCreatorAndSubmitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: reward.applications[0].id
        })
      ])
    );
  });

  it('should not attempt to issue the credential if the user has no wallet', async () => {
    const { space, user: rewardCreatorAndSubmitter } = await testUtilsUser.generateUserAndSpace({
      domain: `cvt-testing-${uuid()}`
    });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: null,
      spaceId: space.id,
      userId: rewardCreatorAndSubmitter.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id]
    });

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bountyId: reward.id
        }
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });

  it('should only issue a reward_submission_approved credential if the application status is complete, processing or paid', async () => {
    const { space, user: rewardCreator } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const submitter = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved']
    });

    const reward = await generateBounty({
      createdBy: rewardCreator.id,
      spaceId: space.id,
      selectedCredentialTemplates: [firstCredentialTemplate.id]
    });

    const applicationStatuses = typedKeys(ApplicationStatus);

    const generatedApplications: Record<ApplicationStatus, Application> = {} as Record<ApplicationStatus, Application>;

    for (const applicationStatus of applicationStatuses) {
      const application = await generateBountyApplication({
        applicationStatus,
        bountyId: reward.id,
        spaceId: space.id,
        userId: submitter.id
      });
      generatedApplications[applicationStatus] = application;
    }

    await issueRewardCredentialsIfNecessary({
      event: 'reward_submission_approved',
      rewardId: reward.id
    });

    // Only 3 valid application statuses, complete, processing or paid
    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(3);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        rewardApplication: {
          bounty: {
            id: reward.id
          }
        }
      }
    });

    // Only 3 valid application statuses, complete, processing or paid
    expect(issuedCredentials).toHaveLength(3);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: generatedApplications.complete.id
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: generatedApplications.processing.id
        }),
        expect.objectContaining<Partial<IssuedCredential>>({
          userId: submitter.id,
          credentialEvent: 'reward_submission_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          rewardApplicationId: generatedApplications.paid.id
        })
      ])
    );
  });
});
