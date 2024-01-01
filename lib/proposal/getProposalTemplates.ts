import { InvalidInputError } from '@charmverse/core/errors';
import type { SpaceResourcesRequest } from '@charmverse/core/permissions';
import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { permissionsApiClient } from 'lib/permissions/api/client';
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

  const templates = await prisma.proposal.findMany({
    where: {
      spaceId,
      page: {
        type: 'proposal_template'
      }
    },
    include: {
      authors: true,
      reviewers: true,
      rewards: true, // note that rewards table is not really used by templates, but makes life easier when we call mapDbProposalToProposal()
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
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      }
    }
  });

  const res = templates.map(
    (proposal) => mapDbProposalToProposal({ proposal, canAccessPrivateFormFields: true }) as ProposalTemplate
  );

  return res;
}
