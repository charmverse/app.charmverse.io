import { prisma, type CredentialTemplate } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { getPagePermalink } from 'lib/pages/getPagePermalink';
import { randomETHWallet } from 'lib/utils/blockchain';

import { proposalApprovedVerb, proposalCreatedVerb } from '../constants';
import {
  findSpaceIssuableProposalCredentials,
  generateCredentialInputsForProposal
} from '../findIssuableProposalCredentials';
import type {
  ProposalWithJoinedData,
  IssuableProposalCredentialContent,
  PartialIssuableProposalCredentialContent
} from '../findIssuableProposalCredentials';

describe('findIssuableProposalCredentialIfNecessary', () => {
  it('should not duplicate credentials for proposals where credentials with the same proposalId and event already feature in a pending Gnosis Safe transaction', async () => {
    const userWalletAddress = randomETHWallet().address;
    const { space, user } = await testUtilsUser.generateUserAndSpace({ wallet: userWalletAddress });

    const secondAuthorWalletAddress = randomETHWallet().address;
    const secondAuthor = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      wallet: secondAuthorWalletAddress
    });

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved', 'proposal_created'],
      schemaType: 'proposal',
      schemaAddress: '0x1234',
      description: 'Description 1',
      name: 'Template 1',
      organization: 'Org 1'
    });

    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved', 'proposal_created'],
      schemaType: 'proposal',
      schemaAddress: '0x1234',
      description: 'Description 2',
      name: 'Template 2',
      organization: 'Org 2'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      proposalStatus: 'published',
      authors: [user.id, secondAuthor.id],
      evaluationInputs: [{ index: 1, result: 'pass', evaluationType: 'pass_fail', permissions: [], reviewers: [] }],
      selectedCredentialTemplateIds: [credentialTemplate.id, secondCredentialTemplate.id],
      userId: user.id
    });

    await prisma.pendingSafeTransaction.create({
      data: {
        chainId: 1,
        safeAddress: '0x1234',
        safeTxHash: '0x1234',
        schemaId: '0x1234',
        proposalIds: [proposal.id],
        space: { connect: { id: space.id } },
        credentialContent: {
          [proposal.id]: [
            {
              credentialTemplateId: credentialTemplate.id,
              event: 'proposal_approved',
              proposalId: proposal.id,
              recipientAddress: userWalletAddress
            }
          ] as PartialIssuableProposalCredentialContent[]
        }
      }
    });

    await prisma.pendingSafeTransaction.create({
      data: {
        chainId: 1,
        safeAddress: '0x1234',
        safeTxHash: '0x12345',
        schemaId: '0x1234',
        proposalIds: [proposal.id],
        space: { connect: { id: space.id } },
        credentialContent: {
          [proposal.id]: [
            {
              credentialTemplateId: secondCredentialTemplate.id,
              event: 'proposal_created',
              proposalId: proposal.id,
              recipientAddress: secondAuthorWalletAddress
            }
          ] as PartialIssuableProposalCredentialContent[]
        }
      }
    });

    const result = await findSpaceIssuableProposalCredentials({ spaceId: space.id });

    // Missing 1 event from first credential, and both events from second credential
    // expect(result).toHaveLength(7);

    expect(result).toMatchObject(
      expect.arrayContaining<IssuableProposalCredentialContent>([
        {
          proposalId: proposal.id,
          recipientUserId: space.createdBy,
          recipientAddress: userWalletAddress,
          credentialTemplateId: credentialTemplate.id,
          event: 'proposal_created',
          pageId: proposal.page.id,
          credential: {
            Description: credentialTemplate.description,
            Name: credentialTemplate.name,
            Organization: credentialTemplate.organization,
            Event: `${proposalCreatedVerb} Proposal`,
            URL: getPagePermalink({ pageId: proposal.page.id })
          }
        } as IssuableProposalCredentialContent,
        {
          proposalId: proposal.id,
          recipientUserId: space.createdBy,
          recipientAddress: userWalletAddress,
          credentialTemplateId: secondCredentialTemplate.id,
          event: 'proposal_created',
          pageId: proposal.page.id,
          credential: {
            Description: secondCredentialTemplate.description,
            Name: secondCredentialTemplate.name,
            Organization: secondCredentialTemplate.organization,
            Event: `${proposalCreatedVerb} Proposal`,
            URL: getPagePermalink({ pageId: proposal.page.id })
          }
        } as IssuableProposalCredentialContent,
        {
          proposalId: proposal.id,
          recipientUserId: user.id,
          recipientAddress: userWalletAddress,
          credentialTemplateId: secondCredentialTemplate.id,
          event: 'proposal_approved',
          pageId: proposal.page.id,
          credential: {
            Description: secondCredentialTemplate.description,
            Name: secondCredentialTemplate.name,
            Organization: secondCredentialTemplate.organization,
            Event: `Proposal ${proposalApprovedVerb}`,
            URL: getPagePermalink({ pageId: proposal.page.id })
          }
        } as IssuableProposalCredentialContent,
        // Second author should be eligible for everything
        {
          proposalId: proposal.id,
          recipientUserId: secondAuthor.id,
          recipientAddress: secondAuthorWalletAddress,
          credentialTemplateId: credentialTemplate.id,
          event: 'proposal_created',
          pageId: proposal.page.id,
          credential: {
            Description: credentialTemplate.description,
            Name: credentialTemplate.name,
            Organization: credentialTemplate.organization,
            Event: `${proposalCreatedVerb} Proposal`,
            URL: getPagePermalink({ pageId: proposal.page.id })
          }
        } as IssuableProposalCredentialContent,
        {
          proposalId: proposal.id,
          recipientUserId: secondAuthor.id,
          recipientAddress: secondAuthorWalletAddress,
          credentialTemplateId: credentialTemplate.id,
          event: 'proposal_created',
          pageId: proposal.page.id,
          credential: {
            Description: credentialTemplate.description,
            Name: credentialTemplate.name,
            Organization: credentialTemplate.organization,
            Event: `${proposalCreatedVerb} Proposal`,
            URL: getPagePermalink({ pageId: proposal.page.id })
          }
        } as IssuableProposalCredentialContent,
        {
          proposalId: proposal.id,
          recipientUserId: secondAuthor.id,
          recipientAddress: secondAuthorWalletAddress,
          credentialTemplateId: secondCredentialTemplate.id,
          event: 'proposal_approved',
          pageId: proposal.page.id,
          credential: {
            Description: secondCredentialTemplate.description,
            Name: secondCredentialTemplate.name,
            Organization: secondCredentialTemplate.organization,
            Event: `Proposal ${proposalApprovedVerb}`,
            URL: getPagePermalink({ pageId: proposal.page.id })
          }
        } as IssuableProposalCredentialContent
      ])
    );
  });
});

describe('generateCredentialInputsForProposal', () => {
  it('should generate correct credential inputs for an approved proposal', () => {
    const proposalId = uuid();
    const authorId1 = uuid();
    const authorId2 = uuid();
    const authorWalletAddress1 = randomETHWallet().address;
    const authorWalletAddress2 = randomETHWallet().address;
    const credentialTemplateId1 = uuid();
    const credentialTemplateId2 = uuid();

    const proposal: ProposalWithJoinedData = {
      id: proposalId,
      status: 'published',
      evaluations: [{ id: uuid(), index: 1, result: 'pass' }],
      selectedCredentialTemplates: [credentialTemplateId1, credentialTemplateId2],
      authors: [
        {
          author: {
            id: authorId1,
            primaryWallet: { address: authorWalletAddress1 },
            wallets: [{ address: randomETHWallet().address }, { address: authorWalletAddress1 }]
          }
        },
        {
          author: {
            id: authorId2,
            primaryWallet: { address: authorWalletAddress2 },
            wallets: [{ address: authorWalletAddress2 }]
          }
        },
        {
          author: {
            id: uuid(),
            primaryWallet: { address: randomETHWallet().address },
            wallets: [{ address: randomETHWallet().address }]
          }
        }
      ],
      issuedCredentials: [],
      page: { id: uuid() }
    };

    const space = {
      id: uuid(),
      features: [],
      credentialTemplates: [
        {
          id: credentialTemplateId1,
          name: 'Template 1',
          description: 'Description 1',
          organization: 'Org 1',
          credentialEvents: ['proposal_approved', 'proposal_created']
        }
      ] as Pick<
        CredentialTemplate,
        'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
      >[]
    };

    const expectedOutput: IssuableProposalCredentialContent[] = [
      {
        proposalId,
        credentialTemplateId: credentialTemplateId1,
        recipientAddress: authorWalletAddress1,
        recipientUserId: authorId1,
        pageId: proposal.page.id,
        event: 'proposal_approved',
        credential: {
          Description: space.credentialTemplates[0].description,
          Name: space.credentialTemplates[0].name,
          Organization: space.credentialTemplates[0].organization,
          Event: 'Proposal Approved',
          URL: getPagePermalink({ pageId: proposal.page.id })
        }
      },
      {
        proposalId,
        credentialTemplateId: credentialTemplateId1,
        recipientAddress: authorWalletAddress2,
        recipientUserId: authorId2,
        pageId: proposal.page.id,
        event: 'proposal_approved',
        credential: {
          Description: space.credentialTemplates[0].description,
          Name: space.credentialTemplates[0].name,
          Organization: space.credentialTemplates[0].organization,
          Event: 'Proposal Approved',
          URL: getPagePermalink({ pageId: proposal.page.id })
        }
      },
      {
        proposalId,
        credentialTemplateId: credentialTemplateId1,
        recipientAddress: authorWalletAddress1,
        recipientUserId: authorId1,
        pageId: proposal.page.id,
        event: 'proposal_created',
        credential: {
          Description: space.credentialTemplates[0].description,
          Name: space.credentialTemplates[0].name,
          Organization: space.credentialTemplates[0].organization,
          Event: 'Published Proposal',
          URL: getPagePermalink({ pageId: proposal.page.id })
        }
      },
      {
        proposalId,
        credentialTemplateId: credentialTemplateId1,
        recipientAddress: authorWalletAddress2,
        recipientUserId: authorId2,
        pageId: proposal.page.id,
        event: 'proposal_created',
        credential: {
          Description: space.credentialTemplates[0].description,
          Name: space.credentialTemplates[0].name,
          Organization: space.credentialTemplates[0].organization,
          Event: 'Published Proposal',
          URL: getPagePermalink({ pageId: proposal.page.id })
        }
      }
    ];

    const result = generateCredentialInputsForProposal({ proposal, space });

    expect(result).toMatchObject(expect.arrayContaining(expectedOutput));
  });

  it('should not generate credentials for proposals with status "draft"', () => {
    const proposalId = uuid();
    const authorId1 = uuid();
    const authorWalletAddress1 = randomETHWallet().address;
    const credentialTemplateId1 = uuid();

    const proposal: ProposalWithJoinedData = {
      id: proposalId,
      // This is the important bit of this test
      status: 'draft',
      evaluations: [{ id: uuid(), index: 1, result: 'pass' }],
      selectedCredentialTemplates: [credentialTemplateId1],
      authors: [
        {
          author: {
            id: authorId1,
            primaryWallet: { address: authorWalletAddress1 },
            wallets: [{ address: randomETHWallet().address }, { address: authorWalletAddress1 }]
          }
        }
      ],
      issuedCredentials: [],
      page: { id: uuid() }
    };

    const space = {
      id: uuid(),
      features: [],
      credentialTemplates: [
        {
          id: credentialTemplateId1,
          name: 'Template 1',
          description: 'Description 1',
          organization: 'Org 1',
          credentialEvents: ['proposal_approved', 'proposal_created']
        }
      ] as Pick<
        CredentialTemplate,
        'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
      >[]
    };

    const result = generateCredentialInputsForProposal({ proposal, space });
    expect(result).toHaveLength(0); // Expect no credential inputs to be generated
  });

  it('should not generate credentials for proposals without selected credential templates', () => {
    const proposalId = uuid();
    const authorId1 = uuid();
    const authorWalletAddress1 = randomETHWallet().address;
    const credentialTemplateId1 = uuid();

    const proposal: ProposalWithJoinedData = {
      id: proposalId,
      status: 'published',
      evaluations: [{ id: uuid(), index: 1, result: 'pass' }],
      // This is the important bit of this test
      selectedCredentialTemplates: [],
      authors: [
        {
          author: {
            id: authorId1,
            primaryWallet: { address: authorWalletAddress1 },
            wallets: [{ address: randomETHWallet().address }, { address: authorWalletAddress1 }]
          }
        }
      ],
      issuedCredentials: [],
      page: { id: uuid() }
    };

    const space = {
      id: uuid(),
      features: [],
      credentialTemplates: [
        {
          id: credentialTemplateId1,
          name: 'Template 1',
          description: 'Description 1',
          organization: 'Org 1',
          credentialEvents: ['proposal_approved', 'proposal_created']
        }
      ] as Pick<
        CredentialTemplate,
        'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
      >[]
    };

    const result = generateCredentialInputsForProposal({ proposal, space });
    expect(result).toHaveLength(0); // Expect no credential inputs to be generated
  });

  it('should not duplicate credentials for proposals where credentials have already been issued', () => {
    const proposalId = uuid();
    const authorId1 = uuid();
    const authorWalletAddress1 = randomETHWallet().address;
    const credentialTemplateId1 = uuid();

    const proposal: ProposalWithJoinedData = {
      id: proposalId,
      status: 'published',
      evaluations: [{ id: uuid(), index: 1, result: 'pass' }],
      // This is the important bit of this test
      selectedCredentialTemplates: [credentialTemplateId1],
      authors: [
        {
          author: {
            id: authorId1,
            primaryWallet: { address: authorWalletAddress1 },
            wallets: [{ address: randomETHWallet().address }, { address: authorWalletAddress1 }]
          }
        }
      ],
      issuedCredentials: [
        // User already has a credential for proposal_created, so we should only get something for proposal_approved
        {
          credentialEvent: 'proposal_created',
          credentialTemplateId: credentialTemplateId1,
          userId: authorId1
        }
      ],
      page: { id: uuid() }
    };

    const space = {
      id: uuid(),
      features: [],
      credentialTemplates: [
        {
          id: credentialTemplateId1,
          name: 'Template 1',
          description: 'Description 1',
          organization: 'Org 1',
          credentialEvents: ['proposal_approved', 'proposal_created']
        }
      ] as Pick<
        CredentialTemplate,
        'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
      >[]
    };

    const result = generateCredentialInputsForProposal({ proposal, space });
    expect(result).toEqual([
      {
        proposalId,
        recipientUserId: authorId1,
        recipientAddress: authorWalletAddress1,
        credentialTemplateId: credentialTemplateId1,
        event: 'proposal_approved',
        pageId: proposal.page.id,
        credential: {
          Description: space.credentialTemplates[0].description,
          Name: space.credentialTemplates[0].name,
          Organization: space.credentialTemplates[0].organization,
          Event: 'Proposal Approved',
          URL: getPagePermalink({ pageId: proposal.page.id })
        }
      } as IssuableProposalCredentialContent
    ]);
  });

  it('should not generate credentials for an event and credential template combination if that template does not contain the event', () => {
    const proposalId = uuid();
    const authorId1 = uuid();
    const authorWalletAddress1 = randomETHWallet().address;
    const credentialTemplateId1 = uuid();

    const proposal: ProposalWithJoinedData = {
      id: proposalId,
      status: 'published',
      evaluations: [{ id: uuid(), index: 1, result: 'pass' }],
      // This is the important bit of this test
      selectedCredentialTemplates: [credentialTemplateId1],
      authors: [
        {
          author: {
            id: authorId1,
            primaryWallet: { address: authorWalletAddress1 },
            wallets: [{ address: randomETHWallet().address }, { address: authorWalletAddress1 }]
          }
        }
      ],
      issuedCredentials: [
        // User already has a credential for proposal_created, so we should only get something for proposal_approved
        {
          credentialEvent: 'proposal_created',
          credentialTemplateId: credentialTemplateId1,
          userId: authorId1
        }
      ],
      page: { id: uuid() }
    };

    const space = {
      id: uuid(),
      features: [],
      credentialTemplates: [
        {
          id: credentialTemplateId1,
          name: 'Template 1',
          description: 'Description 1',
          organization: 'Org 1',
          // This is the important bit of this test. This template only triggers for proposal_created
          credentialEvents: ['proposal_created']
        }
      ] as Pick<
        CredentialTemplate,
        'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
      >[]
    };

    const result = generateCredentialInputsForProposal({ proposal, space });
    expect(result).toEqual([]);
  });
});
