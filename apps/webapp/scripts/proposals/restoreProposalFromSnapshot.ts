import {
  PageType,
  ProposalAppealReviewer,
  ProposalEvaluationPermission,
  ProposalStatus,
  prisma
} from '@charmverse/core/prisma-client';

import { v4 as uuid } from 'uuid';

import { generatePagePathFromPathAndTitle } from 'lib/pages';
import { ExportedProposalTemplate } from './exportProposalTemplate';

// Output from scripts/proposals/exportProposalTemplate.ts
const pageToRestore = {} as ExportedProposalTemplate;

/**
 * Use this script to perform database searches.
 */

async function restoreProposalFromSnapshot() {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: 'domain-name'
    },
    select: {
      id: true,
      domain: true
    }
  });

  const spaceId = space.id;

  console.log('Page to restore', pageToRestore);

  const { page, evaluations, form, ...proposal } = pageToRestore;

  const title = `${page.title} - Restored`;

  const newPath = generatePagePathFromPathAndTitle({
    title
  });

  const created = await prisma.$transaction(async (tx) => {
    const newPage = await tx.page.create({
      data: {
        ...page,
        id: uuid(),
        title: `${page.title} - Restored`,
        proposalId: null,
        path: newPath,
        spaceId,
        content: page.content as any,
        type: page.type as PageType,
        fontFamily: page.fontFamily as any
      }
    });

    const newProposal = await tx.proposal.create({
      data: {
        ...proposal,
        fields: proposal.fields as any,
        id: uuid(),
        spaceId,
        page: { connect: { id: newPage.id } },
        status: proposal.status as ProposalStatus
      }
    });

    const newEvaluations = await Promise.all(
      evaluations.map((evaluation) => {
        const newEvaluationId = uuid();

        return tx.proposalEvaluation.create({
          data: {
            ...evaluation,
            id: newEvaluationId,
            type: evaluation.type as any,
            proposalId: newProposal.id,
            voteSettings: evaluation.voteSettings as any,
            voteId: null,
            actionLabels: evaluation.actionLabels as any,
            notificationLabels: evaluation.notificationLabels as any,
            permissions: {
              createMany: {
                data: evaluation.permissions.map((permission: ProposalEvaluationPermission) => ({
                  ...permission,
                  id: uuid(),
                  evaluationId: undefined
                }))
              }
            },
            appealReviewers: evaluation.appealReviewers.length
              ? {
                  createMany: {
                    data: evaluation.appealReviewers.map((reviewer: ProposalAppealReviewer) => ({
                      ...reviewer,
                      id: uuid(),
                      evaluationId: undefined
                    }))
                  }
                }
              : undefined,
            reviewers: {
              createMany: {
                data: evaluation.reviewers.map((reviewer) => ({
                  ...reviewer,
                  id: uuid(),
                  evaluationId: undefined
                }))
              }
            },
            rubricCriteria: {
              createMany: {
                data: evaluation.rubricCriteria.map((criteria) => ({
                  ...criteria,
                  parameters: criteria.parameters as any,
                  proposalId: newProposal.id,
                  type: criteria.type as any,
                  evaluationId: undefined,
                  id: uuid()
                }))
              }
            }
          }
        });
      })
    );

    const newform = await tx.form.create({
      data: {
        id: uuid(),
        spaceId,
        proposal: { connect: { id: newProposal.id } },
        formFields: {
          createMany: {
            data: form.formFields.map((field) => ({
              ...field,
              options: field.options as any,
              type: field.type as any,
              fieldConfig: field.fieldConfig as any,
              description: field.description as any,
              formId: undefined,
              id: uuid()
            }))
          }
        }
      }
    });

    return newPage;
  });

  console.log(`Visit https://app.charmverse.io/${space.domain}/${newPath} to view the restored page`);

  console.log('Page id', created.id);
}
