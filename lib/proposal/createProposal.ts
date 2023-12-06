import { InsecureOperationError, InvalidInputError } from '@charmverse/core/errors';
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Page, ProposalStatus, PageType } from '@charmverse/core/prisma';
import type { ProposalEvaluationType, ProposalEvaluation, WorkspaceEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers, ProposalReviewerInput } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createPage } from 'lib/pages/server/createPage';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { getPagePath } from '../pages';

import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from './rubric/upsertRubricCriteria';
import { validateProposalAuthorsAndReviewers } from './validateProposalAuthorsAndReviewers';

type PageProps = Partial<
  Pick<Page, 'title' | 'content' | 'contentText' | 'sourceTemplateId' | 'headerImage' | 'icon' | 'type'>
>;

export type ProposalEvaluationInput = Pick<ProposalEvaluation, 'index' | 'title' | 'type'> & {
  reviewers: ProposalReviewerInput[];
  rubricCriteria: RubricDataInput[];
};

export type CreateProposalInput = {
  pageId?: string;
  pageProps?: PageProps;
  categoryId: string;
  reviewers?: TargetPermissionGroup<'role' | 'user'>[];
  authors?: string[];
  userId: string;
  spaceId: string;
  evaluationType?: ProposalEvaluationType;
  rubricCriteria?: RubricDataInput[];
  evaluations: ProposalEvaluationInput[];
  publishToLens?: boolean;
  fields?: ProposalFields;
};

export type CreatedProposal = {
  page: PageWithPermissions;
  proposal: ProposalWithUsers;
};

export async function createProposal({
  userId,
  spaceId,
  categoryId,
  pageProps,
  authors,
  reviewers,
  evaluations = [],
  evaluationType,
  rubricCriteria,
  publishToLens,
  fields
}: CreateProposalInput) {
  if (!categoryId) {
    throw new InvalidInputError('Proposal must be linked to a category');
  }

  const proposalId = uuid();
  let proposalStatus: ProposalStatus = 'draft';

  const authorsList = arrayUtils.uniqueValues(authors ? [...authors, userId] : [userId]);

  const validation = await validateProposalAuthorsAndReviewers({
    authors: authorsList,
    reviewers: reviewers ?? [],
    spaceId
  });

  if (!validation.valid) {
    throw new InsecureOperationError(`You cannot create a proposal with authors or reviewers outside the space`);
  }
  const evaluationIds = evaluations.map(() => uuid());
  // apply evaluation ids to reviewers
  if (evaluationIds.length > 0) {
    reviewers = evaluations.flatMap((evaluation, index) =>
      evaluation.reviewers.map((reviewer) => ({
        ...reviewer,
        evaluationId: evaluationIds[index]
      }))
    );
    proposalStatus = 'published'; // TODO: implement support for drafts
  }
  // Using a transaction to ensure both the proposal and page gets created together
  const [proposal, , page] = await prisma.$transaction([
    prisma.proposal.create({
      data: {
        // Add page creator as the proposal's first author
        createdBy: userId,
        id: proposalId,
        space: { connect: { id: spaceId } },
        status: proposalStatus,
        category: { connect: { id: categoryId } },
        evaluationType,
        publishToLens,
        authors: {
          createMany: {
            data: authorsList.map((author) => ({ userId: author }))
          }
        },
        reviewers: reviewers
          ? {
              createMany: {
                data: reviewers.map((reviewer) => ({
                  userId: reviewer.group === 'user' ? reviewer.id : undefined,
                  roleId: reviewer.group === 'role' ? reviewer.id : undefined
                }))
              }
            }
          : undefined,
        fields
      },
      include: {
        authors: true,
        reviewers: true,
        category: true
      }
    }),
    prisma.proposalEvaluation.createMany({
      // we dont save evaluations as part of the template, since they link to workflow id instead
      data:
        pageProps?.type === 'proposal_template'
          ? []
          : evaluations.map((evaluation, index) => ({
              id: evaluationIds[index],
              index: evaluation.index,
              title: evaluation.title,
              type: evaluation.type,
              proposalId
            }))
    }),
    createPage({
      data: {
        content: pageProps?.content ?? undefined,
        createdBy: userId,
        contentText: pageProps?.contentText ?? '',
        headerImage: pageProps?.headerImage,
        icon: pageProps?.icon,
        id: proposalId,
        path: getPagePath(),
        proposalId,
        sourceTemplateId: pageProps?.sourceTemplateId,
        title: pageProps?.title ?? '',
        type: pageProps?.type ?? 'proposal',
        updatedBy: userId,
        spaceId
      }
    })
  ]);
  trackUserAction('new_proposal_created', { userId, pageId: page.id, resourceId: proposal.id, spaceId });

  const upsertedCriteria = rubricCriteria
    ? await upsertRubricCriteria({
        proposalId: proposal.id,
        rubricCriteria
      })
    : [];

  await Promise.all(
    evaluations
      .filter((evaluation) => evaluation.type === 'rubric')
      .map((evaluation) => upsertRubricCriteria({ proposalId: proposal.id, rubricCriteria: evaluation.rubricCriteria }))
  );

  await publishProposalEvent({
    scope: WebhookEventNames.ProposalStatusChanged,
    proposalId: proposal.id,
    newStatus: proposal.status,
    spaceId,
    userId,
    oldStatus: null
  });

  return {
    page: page as PageWithPermissions,
    proposal: { ...proposal, rubricCriteria: upsertedCriteria, draftRubricAnswers: [], rubricAnswers: [] }
  };
}
