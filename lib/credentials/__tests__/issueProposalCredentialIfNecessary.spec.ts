import type { IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';
import { optimism } from 'viem/chains';

import { signAndPublishCharmverseCredential } from 'lib/credentials/attest';
import { randomETHWalletAddress } from 'testing/generateStubs';

import { issueProposalCredentialsIfNecessary } from '../issueProposalCredentialsIfNecessary';
import type { PublishedSignedCredential } from '../queriesAndMutations';
import { getAttestationSchemaId } from '../schemas';

jest.mock('lib/credentials/attest', () => ({
  signAndPublishCharmverseCredential: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: optimism.id,
      content: {},
      id: uuid(),
      issuer: '0x66d96dab921F7c8Ce98d0e05fb0B76Db8Bd54773',
      recipient: '0xAEfe164A5f55121AD98d0e347dA7990CcC8BE295',
      schemaId: getAttestationSchemaId({
        chainId: optimism.id,
        credentialType: 'proposal'
      }),
      sig: 'Signature content',
      timestamp: new Date(),
      type: 'proposal',
      verificationUrl: 'https://eas-explorer-example.com/verification'
    } as PublishedSignedCredential)
  )
}));

const mockedSignAndPublishCharmverseCredential = jest.mocked(signAndPublishCharmverseCredential);

describe('issueProposalCredentialIfNecessary', () => {
  it('should issue credentials once for a unique combination of user, proposal and credential template', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });
    const author2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, wallet: randomETHWalletAddress() });
    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved', 'proposal_created']
    });
    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved', 'proposal_created']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id, author2.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id, secondCredentialTemplate.id],
      proposalStatus: 'published',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [], result: 'pass' }]
    });

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });
    await issueProposalCredentialsIfNecessary({
      event: 'proposal_created',
      proposalId: proposal.id
    });

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_created',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(8);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    // 2 event types * 2 credential templates * 2 authors
    expect(issuedCredentials).toHaveLength(8);

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
        }),
        expect.objectContaining({
          userId: author1.id,
          credentialEvent: 'proposal_created',
          credentialTemplateId: firstCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author2.id,
          credentialEvent: 'proposal_created',
          credentialTemplateId: firstCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author1.id,
          credentialEvent: 'proposal_created',
          credentialTemplateId: secondCredentialTemplate.id
        }),
        expect.objectContaining({
          userId: author2.id,
          credentialEvent: 'proposal_created',
          credentialTemplateId: secondCredentialTemplate.id
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

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_created',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(2);

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

    await issueProposalCredentialsIfNecessary({
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

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(6);

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

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(1);

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

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });

  it('should not issue a proposal_created credential if the proposal status is draft', async () => {
    const { space, user: author1 } = await testUtilsUser.generateUserAndSpace({
      wallet: randomETHWalletAddress(),
      domain: `cvt-testing-${uuid()}`
    });

    const firstCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_created']
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      authors: [author1.id],
      userId: author1.id,
      selectedCredentialTemplateIds: [firstCredentialTemplate.id],
      proposalStatus: 'draft',
      evaluationInputs: [{ reviewers: [], evaluationType: 'pass_fail', permissions: [] }]
    });

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_created',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(0);

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

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(0);

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

    await issueProposalCredentialsIfNecessary({
      event: 'proposal_approved',
      proposalId: proposal.id
    });

    expect(mockedSignAndPublishCharmverseCredential).toHaveBeenCalledTimes(0);

    const issuedCredentials = await prisma.issuedCredential.findMany({
      where: {
        proposalId: proposal.id
      }
    });

    expect(issuedCredentials).toHaveLength(0);
  });
});
