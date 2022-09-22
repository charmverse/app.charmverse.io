import type { Space, User } from '@prisma/client';
import { InsecureOperationError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { createProposalTemplate } from '../../templates/proposals/createProposalTemplate';
import { createProposal } from '../createProposal';
import { proposalPermissionMapping } from '../syncProposalPermissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and returns it with the attached proposal', async () => {
    const pageWithProposal = await createProposal({
      pageCreateInput: {
        author: {
          connect: {
            id: user.id
          }
        },
        contentText: '',
        path: 'path',
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'page-title',
        type: 'proposal',
        updatedBy: user.id
      },
      spaceId: space.id,
      userId: user.id
    });

    expect(pageWithProposal).toMatchObject(expect.objectContaining({
      title: 'page-title',
      type: 'proposal',
      proposal: expect.objectContaining({
        authors: [{
          proposalId: pageWithProposal.id,
          userId: user.id
        }],
        reviewers: []
      })
    }));
  });

  it('Should create a proposal from a template', async () => {

    const reviewerUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: user.id,
      reviewers: [{
        group: 'user',
        id: reviewerUser.id
      }],
      pageContent: {
        contentText: 'This is a document page',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph'
            },
            {
              type: 'paragraph',
              content: [
                {
                  text: 'This is a document page',
                  type: 'text'
                }
              ]
            }
          ]
        }
      }
    });

    const duplicatedProposal = await createProposal({
      spaceId: space.id,
      userId: user.id,
      templateId: proposalTemplate.id
    });

    expect(duplicatedProposal.type === 'proposal').toBe(true);
    expect(duplicatedProposal.content?.toString()).toEqual(proposalTemplate.content?.toString());
    expect(duplicatedProposal.proposal?.authors.length).toEqual(1);
    expect(duplicatedProposal.proposal?.authors[0].userId).toEqual(user.id);
    expect(duplicatedProposal.proposal?.reviewers.length).toEqual(1);
    expect(duplicatedProposal.proposal?.reviewers[0].userId).toEqual(reviewerUser.id);

  });

  it('Should provision the proposal permissions', async () => {

    const pageWithProposal = await createProposal({
      pageCreateInput: {
        author: {
          connect: {
            id: user.id
          }
        },
        contentText: '',
        path: 'path',
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'page-title',
        type: 'proposal',
        updatedBy: user.id
      },
      spaceId: space.id,
      userId: user.id
    });

    const privateDraftAuthorPermissionLevel = proposalPermissionMapping.private_draft.author;

    expect(pageWithProposal.permissions.some(p => p.userId === user.id && p.permissionLevel === privateDraftAuthorPermissionLevel)).toBe(true);
  });

  it('should throw an error if trying to use a proposal template from a different space', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken();

    const proposalTemplate = await createProposalTemplate({
      spaceId: otherSpace.id,
      userId: otherUser.id
    });

    await (expect(createProposal({
      spaceId: space.id,
      userId: user.id,
      templateId: proposalTemplate.id
    }))).rejects.toBeInstanceOf(InsecureOperationError);
  });
});
