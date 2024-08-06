import { InvalidInputError } from '@charmverse/core/errors';
import type { Space, User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@root/lib/utils/blockchain';
import { v4 as uuid } from 'uuid';
import { mainnet } from 'viem/chains';

import type { PartialIssuableProposalCredentialContent } from '../findIssuableProposalCredentials';
import type { PartialIssuableRewardApplicationCredentialContent } from '../findIssuableRewardCredentials';
import type { TypedPendingGnosisSafeTransaction } from '../indexGnosisSafeCredentialTransaction';
import { saveGnosisSafeTransactionToIndex } from '../indexGnosisSafeCredentialTransaction';
import { proposalCredentialSchemaId } from '../schemas/proposal';
import { rewardCredentialSchemaId } from '../schemas/reward';

describe('saveGnosisSafeTransactionToIndex', () => {
  let space: Space;
  let user: User;

  beforeAll(async () => {
    ({ space, user } = await testUtilsUser.generateUserAndSpace());
  });

  it('creates a transaction record for a proposal, with pending credentials grouped by proposal ID', async () => {
    const proposalId = uuid();
    const secondProposalId = uuid();

    const safeAddress = randomETHWalletAddress();

    const firstProposalCredentials: PartialIssuableProposalCredentialContent[] = [
      {
        proposalId,
        credentialTemplateId: uuid(),
        event: 'proposal_approved',
        recipientAddress: randomETHWalletAddress(),
        recipientUserId: user.id
      },
      {
        proposalId,
        credentialTemplateId: uuid(),
        event: 'proposal_approved',
        recipientAddress: randomETHWalletAddress(),
        recipientUserId: user.id
      }
    ];

    const secondProposalCredentials: PartialIssuableProposalCredentialContent[] = [
      {
        proposalId: secondProposalId,
        credentialTemplateId: uuid(),
        event: 'proposal_approved',
        recipientAddress: randomETHWalletAddress(),
        recipientUserId: user.id
      }
    ];

    const transaction = await saveGnosisSafeTransactionToIndex({
      chainId: mainnet.id,
      credentials: [...firstProposalCredentials, ...secondProposalCredentials],
      safeAddress,
      safeTxHash: uuid(),
      schemaId: proposalCredentialSchemaId,
      spaceId: space.id,
      type: 'proposal'
    });

    expect(transaction).toMatchObject<TypedPendingGnosisSafeTransaction<'proposal'>>({
      safeTxHash: expect.any(String),
      chainId: mainnet.id,
      safeAddress,
      spaceId: space.id,
      credentialType: 'proposal',
      schemaId: proposalCredentialSchemaId,
      proposalIds: [proposalId, secondProposalId],
      rewardIds: [],
      processed: false,
      credentialContent: {
        [proposalId]: firstProposalCredentials,
        [secondProposalId]: secondProposalCredentials
      }
    });
  });

  it('creates a transaction record for a reward, with pending credentials grouped by reward ID', async () => {
    const rewardId = uuid();
    const secondRewardId = uuid();

    const safeAddress = randomETHWalletAddress();

    const firstRewardCredentials: PartialIssuableRewardApplicationCredentialContent[] = [
      {
        rewardId,
        rewardApplicationId: uuid(),
        credentialTemplateId: uuid(),
        event: 'reward_submission_approved',
        recipientAddress: randomETHWalletAddress(),
        recipientUserId: user.id
      },
      {
        rewardId,
        rewardApplicationId: uuid(),
        credentialTemplateId: uuid(),
        event: 'reward_submission_approved',
        recipientAddress: randomETHWalletAddress(),
        recipientUserId: user.id
      }
    ];

    const secondRewardCredentials: PartialIssuableRewardApplicationCredentialContent[] = [
      {
        rewardId: secondRewardId,
        rewardApplicationId: uuid(),
        credentialTemplateId: uuid(),
        event: 'reward_submission_approved',
        recipientAddress: randomETHWalletAddress(),
        recipientUserId: user.id
      }
    ];

    const transaction = await saveGnosisSafeTransactionToIndex({
      chainId: mainnet.id,
      credentials: [...firstRewardCredentials, ...secondRewardCredentials],
      safeAddress,
      safeTxHash: uuid(),
      schemaId: rewardCredentialSchemaId,
      spaceId: space.id,
      type: 'reward'
    });

    expect(transaction).toMatchObject<TypedPendingGnosisSafeTransaction<'reward'>>({
      safeTxHash: expect.any(String),
      chainId: mainnet.id,
      safeAddress,
      spaceId: space.id,
      schemaId: rewardCredentialSchemaId,
      proposalIds: [],
      rewardIds: [rewardId, secondRewardId],
      credentialType: 'reward',
      processed: false,
      credentialContent: {
        [rewardId]: firstRewardCredentials,
        [secondRewardId]: secondRewardCredentials
      }
    });
  });

  it('throws InvalidInputError for invalid credential type', async () => {
    await expect(
      saveGnosisSafeTransactionToIndex({
        chainId: mainnet.id,
        credentials: [],
        safeAddress: '0xSafeAddressExample',
        safeTxHash: uuid(),
        schemaId: proposalCredentialSchemaId,
        spaceId: space.id,
        // We don't support external credentials, only reward and proposal
        type: 'external'
      })
    ).rejects.toThrow(InvalidInputError);
  });
});
