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
import { pseudoRandomHexString } from '@root/lib/utils/random';
import { v4 as uuid } from 'uuid';
import { mainnet } from 'viem/chains';

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
});
