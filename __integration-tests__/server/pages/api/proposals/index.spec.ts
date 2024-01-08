import type { Space, User, Role } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { CreateProposalInput } from 'lib/proposal/createProposal';
import { emptyDocument } from 'lib/prosemirror/constants';
import { assignRole } from 'lib/roles';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createRole } from 'testing/utils/roles';

let space: Space;
let proposalCreator: User;
let spaceMember: User;
let proposalCreatorRole: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  proposalCreator = generated.user;
  spaceMember = await testUtilsUser.generateSpaceUser({
    spaceId: space.id
  });
  proposalCreatorRole = await createRole({
    spaceId: space.id,
    createdBy: proposalCreator.id,
    name: 'Proposal Creator'
  });

  await assignRole({
    roleId: proposalCreatorRole.id,
    userId: proposalCreator.id
  });
});

describe('POST /api/proposals - Create a proposal', () => {
  it('should allow a user to create a proposal in a specific category, with page content, reviewers and authors configured and respond with 201', async () => {
    const userCookie = await loginUser(proposalCreator.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    await prisma.spacePermission.create({
      data: {
        forSpace: { connect: { id: space.id } },
        operations: ['createProposals'],
        role: { connect: { id: proposalCreatorRole.id } }
      }
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id, otherUser.id],
      reviewers: [{ group: 'user', id: proposalCreator.id }],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };

    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(201);
  });

  it('should fail to create a proposal if the user does not have permissions for creating proposal and respond with 401', async () => {
    const userCookie = await loginUser(spaceMember.id);

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: spaceMember.id,
      authors: [spaceMember.id],
      reviewers: [{ group: 'user', id: spaceMember.id }],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });

  it('should fail to create a proposal template if the user is not an admin', async () => {
    const userCookie = await loginUser(proposalCreator.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id, otherUser.id],
      reviewers: [{ group: 'user', id: proposalCreator.id }],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal',
        type: 'proposal_template'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });
});
