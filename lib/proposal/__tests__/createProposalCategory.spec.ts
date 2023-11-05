import type { ProposalCategory } from '@charmverse/core/prisma';

import { generateUserAndSpace } from 'testing/setupDatabase';

import type { CreateProposalCategoryInput } from '../createProposalCategory';
import { createProposalCategory } from '../createProposalCategory';

describe('createProposalCategory', () => {
  it('should create a proposal category', async () => {
    const { space } = await generateUserAndSpace();

    const createInput: CreateProposalCategoryInput = {
      title: 'Test Category permissions',
      spaceId: space.id
    };

    const proposalCategory = await createProposalCategory({ data: createInput });

    expect(proposalCategory).toMatchObject<ProposalCategory>({
      id: expect.any(String),
      title: createInput.title,
      spaceId: space.id,
      color: expect.any(String)
    });
  });
});
