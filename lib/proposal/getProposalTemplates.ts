import { InvalidInputError } from '@charmverse/core/errors';
import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateCategoryIdQuery } from '@charmverse/core/proposals';
import { stringUtils } from '@charmverse/core/utilities';

import { permissionsApiClient } from 'lib/permissions/api/routers';
import { mapDbProposalToProposal } from 'lib/proposal/mapDbProposalToProposal';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import type { ProposalWithUsersAndRubric } from './interface';

export type ProposalTemplate = ProposalWithUsersAndRubric & { page: Page };

export async function getProposalTemplates({ spaceId, userId }: SpaceResourcesRequest): Promise<ProposalTemplate[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`SpaceID is required`);
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      paidTier: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return [];
  }

  let categoryIds: string[] | undefined;

  // If this is a paid space, we only want to provide the user with templates within categories where they can create a proposal
  if (space?.paidTier !== 'free') {
    const accessibleCategories = await permissionsApiClient.proposals
      .getAccessibleProposalCategories({
        spaceId,
        userId
      })
      .then((categories) => categories.filter((c) => c.permissions.create_proposal));

    if (accessibleCategories.length === 0) {
      return [];
    }

    categoryIds = accessibleCategories.map((c) => c.id);
  }

  const templates = await prisma.proposal.findMany({
    where: {
      spaceId,
      page: {
        type: 'proposal_template'
      },
      categoryId: generateCategoryIdQuery(categoryIds)
    },
    include: {
      authors: true,
      reviewers: true,
      rewards: true, // note that rewards table is not really used by templates, but makes life easier when we call mapDbProposalToProposal()
      category: true,
      page: true,
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          permissions: true,
          reviewers: true,
          rubricCriteria: true,
          rubricAnswers: true,
          draftRubricAnswers: true,
          vote: true
        }
      },
      draftRubricAnswers: true,
      rubricAnswers: true,
      rubricCriteria: {
        orderBy: {
          index: 'asc'
        }
      },
      form: {
        include: {
          formFields: true
        }
      }
    }
  });
  return templates.map((proposal) => mapDbProposalToProposal({ proposal })) as ProposalTemplate[];
}
