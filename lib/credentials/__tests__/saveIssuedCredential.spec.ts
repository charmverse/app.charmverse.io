import { InvalidInputError } from '@charmverse/core/errors';
import type {
  Application,
  Bounty,
  CredentialTemplate,
  IssuedCredential,
  Proposal,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';
import { mainnet } from 'viem/chains';

import { pseudoRandomHexString } from 'lib/utils/random';
import { generateBountyWithSingleApplication } from 'testing/setupDatabase';

import type { IdenticalCredentialProps } from '../saveIssuedCredential';
import { saveIssuedCredential } from '../saveIssuedCredential';
import { proposalCredentialSchemaId } from '../schemas/proposal';
import { rewardCredentialSchemaId } from '../schemas/reward';

describe('saveIssuedCredential', () => {
  let user: User;
  let space: Space;
  let proposal: Proposal;
  let proposalCredentialTemplate: CredentialTemplate;
  let reward: Bounty;
  let rewardApplication: Application;
  let rewardCredentialTemplate: CredentialTemplate;

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace());
    proposalCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved', 'proposal_created'],
      description: 'Proposal credential template',
      name: 'Proposal credential template',
      schemaAddress: proposalCredentialSchemaId,
      organization: 'Org',
      schemaType: 'proposal'
    });
    rewardCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['reward_submission_approved'],
      description: 'Reward credential template',
      name: 'Reward credential template',
      schemaAddress: 'schemaAddress',
      organization: 'Org',
      schemaType: 'reward'
    });

    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const generatedReward = await generateBountyWithSingleApplication({
      spaceId: space.id,
      userId: user.id,
      applicationStatus: 'complete',
      bountyCap: null
    });

    reward = generatedReward;

    rewardApplication = generatedReward.applications[0];
  });

  it('should create a new issued credential with proposalId and save a matching credential against the existing issued credential', async () => {
    const validOffchainData = {
      ceramicId: pseudoRandomHexString(),
      ceramicRecord: { data: 'dataExample' }
    };

    const validOnChainData = {
      onchainChainId: mainnet.id,
      onchainAttestationId: pseudoRandomHexString()
    };

    const commonData: IdenticalCredentialProps = {
      credentialTemplateId: proposalCredentialTemplate.id,
      userId: user.id,
      credentialEvent: 'proposal_approved',
      schemaId: proposalCredentialSchemaId,
      proposalId: proposal.id
    };

    const issuedCredential = await saveIssuedCredential({
      credentialProps: commonData,
      offchainData: validOffchainData
    });

    expect(issuedCredential).toMatchObject(
      expect.objectContaining<Partial<IssuedCredential>>({
        ...commonData,
        ceramicId: validOffchainData.ceramicId,
        ceramicRecord: validOffchainData.ceramicRecord,
        onchainAttestationId: null,
        onchainChainId: null
      })
    );

    const resavedCredential = await saveIssuedCredential({
      credentialProps: commonData,
      onChainData: validOnChainData
    });

    expect(resavedCredential).toEqual({ ...issuedCredential, ...validOnChainData });
  });

  it('should create a new issued credential with rewardApplicationId and save a matching credential against the existing issued credential', async () => {
    const validOffchainData = {
      ceramicId: pseudoRandomHexString(),
      ceramicRecord: { data: 'dataExample' }
    };

    const validOnChainData = {
      onchainChainId: mainnet.id,
      onchainAttestationId: pseudoRandomHexString()
    };

    const commonData: IdenticalCredentialProps = {
      credentialTemplateId: rewardCredentialTemplate.id,
      userId: user.id,
      credentialEvent: 'reward_submission_approved',
      schemaId: rewardCredentialSchemaId,
      rewardApplicationId: rewardApplication.id
    };

    const issuedCredential = await saveIssuedCredential({
      credentialProps: commonData,
      offchainData: validOffchainData
    });

    expect(issuedCredential).toMatchObject(
      expect.objectContaining<Partial<IssuedCredential>>({
        ...commonData,
        ceramicId: validOffchainData.ceramicId,
        ceramicRecord: validOffchainData.ceramicRecord,
        onchainAttestationId: null,
        onchainChainId: null
      })
    );

    const resavedCredential = await saveIssuedCredential({
      credentialProps: commonData,
      onChainData: validOnChainData
    });

    expect(resavedCredential).toEqual({ ...issuedCredential, ...validOnChainData });
  });

  it('should throw invalid input error if both proposalId and rewardApplicationId are provided', async () => {
    await expect(
      saveIssuedCredential({
        credentialProps: {
          credentialTemplateId: proposalCredentialTemplate.id,
          userId: user.id,
          credentialEvent: 'proposal_approved',
          schemaId: proposalCredentialSchemaId,
          proposalId: uuid(),
          rewardApplicationId: uuid()
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw invalid input error if neither proposalId nor rewardApplicationId is provided, or they are both provided', async () => {
    await expect(
      saveIssuedCredential({
        credentialProps: {
          credentialTemplateId: proposalCredentialTemplate.id,
          userId: user.id,
          credentialEvent: 'proposal_approved',
          schemaId: proposalCredentialSchemaId,
          proposalId: undefined,
          rewardApplicationId: undefined
        },
        offchainData: {
          ceramicId: pseudoRandomHexString(),
          ceramicRecord: { data: 'dataExample' }
        }
      })
    ).rejects.toThrow(InvalidInputError);

    await expect(
      saveIssuedCredential({
        credentialProps: {
          credentialTemplateId: proposalCredentialTemplate.id,
          userId: user.id,
          credentialEvent: 'proposal_approved',
          schemaId: proposalCredentialSchemaId,
          proposalId: uuid(),
          rewardApplicationId: uuid()
        },
        offchainData: {
          ceramicId: pseudoRandomHexString(),
          ceramicRecord: { data: 'dataExample' }
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw invalid input error if no offchainData or onChainData is provided', async () => {
    await expect(
      saveIssuedCredential({
        credentialProps: {
          credentialTemplateId: proposalCredentialTemplate.id,
          userId: user.id,
          credentialEvent: 'proposal_approved',
          schemaId: proposalCredentialSchemaId,
          proposalId: uuid(),
          rewardApplicationId: undefined
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });
});
