import {
  Form,
  FormField,
  Page,
  Proposal,
  ProposalAppealReviewer,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalReviewer,
  ProposalRubricCriteria,
  prisma
} from '@charmverse/core/prisma-client';
import { writeToSameFolder } from '@packages/lib/utils/file';

/**
 * Use this script to perform database searches.
 */

export type ExportedProposalTemplate = Proposal & {
  page: Page;
  form: Form & {
    formFields: FormField[];
  };
  evaluations: (ProposalEvaluation & {
    rubricCriteria: ProposalRubricCriteria[];
    reviewers: ProposalReviewer[];
    appealReviewers: ProposalAppealReviewer[];
    permissions: ProposalEvaluationPermission[];
  })[];
};

async function exportProposalTemplate(): Promise<ExportedProposalTemplate> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: '123445'
    },
    include: {
      page: true,
      form: {
        include: {
          formFields: true
        }
      },
      evaluations: {
        include: {
          rubricCriteria: true,
          reviewers: true,
          appealReviewers: true,
          permissions: true
        }
      }
    }
  });

  await writeToSameFolder({ fileName: 'proposal.json', data: JSON.stringify(proposal, null, 2) });

  return proposal as ExportedProposalTemplate;
}
