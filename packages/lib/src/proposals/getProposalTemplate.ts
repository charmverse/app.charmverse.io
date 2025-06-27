import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalPermissionFlags } from '@packages/core/permissions';
import { getCurrentEvaluation } from '@packages/core/proposals';

import type { ProposalWithUsersAndRubric } from './interfaces';
import { mapDbProposalToProposal } from './mapDbProposalToProposal';

const mockPermissions: ProposalPermissionFlags = {
  evaluate: true,
  comment: true,
  edit: true,
  edit_rewards: true,
  delete: true,
  view: false,
  view_notes: false,
  view_private_fields: true,
  create_vote: false,
  make_public: false,
  archive: false,
  unarchive: false,
  move: false,
  evaluate_appeal: false,
  complete_evaluation: false
};

export async function getProposalTemplate({ pageId }: { pageId: string }): Promise<ProposalWithUsersAndRubric> {
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: pageId
      }
    },
    include: {
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          permissions: true,
          reviewers: true,
          appealReviewers: true,
          rubricCriteria: {
            orderBy: {
              index: 'asc'
            }
          },
          rubricAnswers: true,
          draftRubricAnswers: true,
          reviews: true,
          vote: true,
          appealReviews: true
        }
      },
      authors: true,
      page: { select: { id: true, content: true, contentText: true, sourceTemplateId: true, type: true } },
      rewards: true,
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

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  return mapDbProposalToProposal({
    proposal,
    permissionsByStep: {
      [currentEvaluation?.id || 'draft']: mockPermissions
    },
    workflow: null
  });
}
