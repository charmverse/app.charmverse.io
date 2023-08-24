import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { PageWithProposal } from 'lib/pages';
import { DataNotFoundError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { getProposal } from '../getProposal';

describe('getProposal', () => {
  it('should return the proposal page content, permissions and proposal data', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const { page: pageMeta, ...proposal } = await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id
    });

    const page = (await prisma.page.findUnique({
      where: {
        id: proposal.id
      }
    })) as Page;

    const proposalFromDb = await getProposal({ proposalId: proposal.id });

    expect(proposalFromDb).toMatchObject(
      expect.objectContaining<PageWithProposal>({
        ...page,
        proposal: {
          lensPostLink: null,
          publishToLens: null,
          authors: [],
          category: proposalCategory,
          categoryId: proposalCategory.id,
          createdBy: user.id,
          id: proposal.id,
          reviewedAt: null,
          reviewedBy: null,
          reviewers: [],
          snapshotProposalExpiry: null,
          spaceId: space.id,
          status: proposal.status,
          archived: expect.any(Boolean),
          evaluationType: 'vote',
          rubricAnswers: [],
          rubricCriteria: [],
          page: {
            sourceTemplateId: null
          }
        }
      })
    );
  });

  it('should throw an error if the proposal does not exist', async () => {
    await expect(getProposal({ proposalId: v4() })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
