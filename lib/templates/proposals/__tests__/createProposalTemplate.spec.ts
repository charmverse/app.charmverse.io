import type { Space, User } from '@charmverse/core/prisma';

import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposalTemplate } from '../createProposalTemplate';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  space = generated.space;
  user = generated.user;
});

describe('createProposalTemplate', () => {
  it('should create a proposal template', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const pageContentNodes = {
      type: 'doc',
      paragraphs: ['1', '2', '3']
    };

    const title = 'Testing title';

    const template = await createProposalTemplate({
      spaceId: space.id,
      userId: user.id,
      pageContent: {
        content: pageContentNodes,
        title
      },
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'role',
          id: role.id
        },
        {
          group: 'user',
          id: user.id
        }
      ]
    });

    expect(template.type).toBe('proposal_template');
    expect(template.id).toBe(template.proposalId);
    expect(template.title).toBe(title);
    expect(template.content?.toString()).toBe(pageContentNodes.toString());
    expect(template.proposal?.categoryId).toBe(proposalCategory.id);
    expect(template.proposal?.reviewers.length).toBe(2);
    expect(template.proposal?.reviewers.some((r) => r.roleId === role.id && !r.userId)).toBe(true);
    expect(template.proposal?.reviewers.some((r) => r.userId === user.id && !r.roleId)).toBe(true);
  });

  it('should throw an error if categoryId is not provided', async () => {
    await expect(
      createProposalTemplate({
        spaceId: space.id,
        userId: user.id,
        categoryId: undefined as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
