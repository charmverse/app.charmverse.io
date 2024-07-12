import type { IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { pseudoRandomHexString } from '@root/lib/utils/random';
import { v4 as uuid } from 'uuid';
import { optimism } from 'viem/chains';

import { randomETHWalletAddress } from 'testing/generateStubs';

import { issueOffchainProposalCredentialsIfNecessary } from '../issueOffchainProposalCredentialsIfNecessary';
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
      schemaId: attestationSchemaIds.proposal,
      sig: 'Signature content',
      timestamp: new Date(),
      type: 'proposal',
      verificationUrl: 'https://eas-explorer-example.com/verification'
    } as PublishedSignedCredential)
  )
}));

const mockedPublishSignedCredential = jest.mocked(publishSignedCredential);

afterEach(() => {
  mockedPublishSignedCredential.mockClear();
});

describe('issueProposalCredentialIfNecessary', () => {
  it('should issue credentials once for a unique combination of user, proposal, event and credential template', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const author2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id, author2.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(4);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    // 1 event types * 2 credential templates * 2 authors
    expect(issuedCredentials).toHaveLength(4);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining({
          userId: author1.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author1.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author2.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: secondCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author2.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: secondCredentialTemplate.id
        })
      ])
    );
  });

  it('should not issue credentials if the proposal is a template', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      pageType: 'proposal_template',
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);
  });

  it('should issue the offchain credentials for a unique combination of user, proposal, event and credential template if it exists onchain, but not offchain', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    const existingOnchainCredential = await testUtilsCredentials.generateIssuedOnchainCredential({
      credentialEvent: 'proposal_approved',
      credentialTemplateId: firstCredentialTemplate.id,
      userId: author1.id,
      proposalId: proposal.id,
      onchainChainId: optimism.id,
      onchainAttestationId: pseudoRandomHexString()
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(1);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    // 2 event types * 2 credential templates * 2 authors
    expect(issuedCredentials).toHaveLength(1);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining<Partial<IssuedCredential>>({
          id: existingOnchainCredential.id,
          userId: author1.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id,
          ceramicId: expect.any(String),
          onchainChainId: existingOnchainCredential.onchainChainId,
          onchainAttestationId: existingOnchainCredential.onchainAttestationId
        })
      ])
    );
  });

  it('should only issue credentials if the credential template allows issuing credentials for the event', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const author2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: []
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id, author2.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(2);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    // 1 event type * 1 credential templates * 2 authors
    expect(issuedCredentials).toHaveLength(2);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining({
          userId: author1.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author2.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id
        })
      ])
    );
  });

  it('should issue credentials for newly added authors', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const author2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id, author2.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    const newAuthor = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });

    await prisma.proposalAuthor.create({
      data: {
        author: { connect: { id: newAuthor.id } },
        proposal: { connect: { id: proposal.id } }
      }
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(6);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id,
        userId: newAuthor.id
      }
    });

    // 1 event types * 2 credential templates * 1 author (filtered on the query)
    expect(issuedCredentials).toHaveLength(2);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining({
          userId: newAuthor.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: newAuthor.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: secondCredentialTemplate.id
        })
      ])
    );
  });

  it('should ignore inexistent selected credentials', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });

    const inexistentCredentialId = uuid();

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, inexistentCredentialId],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(1);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    // 1 event types * 1 existing credential template * 1 author
    expect(issuedCredentials).toHaveLength(1);

    expect(issuedCredentials).toMatchObject(
      expect.arrayContaining<Partial<IssuedCredential>>([
        expect.objectContaining({
          userId: author1.id,
          credentialEvent: 'proposal_approved',
          credentialTemplateId: firstCredentialTemplate.id
        })
      ])
    );
  });

  it('should not attempt to issue the credential if the user has no wallet', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      // Dont' assign a wallet to the user
      wallet: undefined,
      domain: `cvt-testing-${uuid()}`
    });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });

  it('should not issue a proposal_approved credential if the proposal status is draft', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'draft',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [] }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });

  it('should not issue a proposal_approved credential if the proposal evaluation is failed', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', result: 'fail', permissions: [] }]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });

  it('should not issue a proposal_approved credential if the final proposal evaluation has not been reached', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [
        { reviewers: [], evaluationType: 'pass_fail', result: 'pass', permissions: [] },
        { reviewers: [], evaluationType: 'pass_fail', permissions: [] }
      ]
    });

    await issueOffchainProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedPublishSignedCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });
});
