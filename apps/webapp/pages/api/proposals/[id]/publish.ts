import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import type { WorkflowEvaluationJson } from '@packages/core/proposals';
import { issueProposalPublishedQualifyingEvent } from '@packages/credentials/reputation/issueProposalPublishedQualifyingEvent';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { FieldAnswerInput, FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import { getProposalErrors } from '@packages/lib/proposals/getProposalErrors';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import { publishProposal } from '@packages/lib/proposals/publishProposal';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishProposalEvent, publishProposalEventBase } from '@packages/lib/webhookPublisher/publishEvent';
import { trackOpUserAction } from '@packages/metrics/mixpanel/trackOpUserAction';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { optimismSepolia } from 'viem/chains';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishProposalStatusController);

async function publishProposalStatusController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.edit) {
    throw new ActionNotPermittedError(`You do not have permission to publish this proposal`);
  }

  const proposalPage = await prisma.page.findUniqueOrThrow({
    where: {
      proposalId
    },
    select: {
      id: true,
      title: true,
      hasContent: true,
      type: true,
      space: {
        select: {
          domain: true
        }
      },
      proposal: {
        include: {
          authors: true,
          formAnswers: true,
          evaluations: {
            include: {
              reviewers: true,
              appealReviewers: true,
              rubricCriteria: true
            },
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
          },
          project: {
            include: {
              projectMembers: true
            }
          }
        }
      },
      spaceId: true
    }
  });

  if (!proposalPage.proposal) {
    throw new Error('Proposal not found for page');
  }

  const computedPermissions = await permissionsApiClient.spaces.computeSpacePermissions({
    resourceId: proposalPage.spaceId,
    userId
  });

  if (!computedPermissions.createProposals) {
    throw new ActionNotPermittedError(`You do not have permission to create a proposal`);
  }

  const { isAdmin } = await hasAccessToSpace({
    spaceId: proposalPage.spaceId,
    userId,
    adminOnly: false
  });

  const isProposalArchived = proposalPage.proposal?.archived || false;
  if (isProposalArchived) {
    throw new ActionNotPermittedError(`You cannot publish an archived proposal`);
  }
  // dont expect values for any form fields that depend on an evaluation step
  const formFields = (proposalPage.proposal.form?.formFields as unknown as FormFieldInput[])?.filter(
    (field) => typeof field.dependsOnStepIndex !== 'number'
  );
  const errors = getProposalErrors({
    page: {
      title: proposalPage.title ?? '',
      type: proposalPage.type,
      hasContent: proposalPage.hasContent
    },
    contentType: proposalPage.proposal.formId ? 'structured' : 'free_form',
    proposal: {
      ...proposalPage.proposal,
      evaluations: proposalPage.proposal.evaluations.map((e) => ({
        ...e,
        notificationLabels: e.notificationLabels as WorkflowEvaluationJson['notificationLabels'],
        actionLabels: e.actionLabels as WorkflowEvaluationJson['actionLabels'],
        voteSettings: e.voteSettings as any,
        rubricCriteria: e.rubricCriteria as any[]
      })),
      fields: proposalPage.proposal.fields as ProposalFields,
      authors: proposalPage.proposal.authors.map((a) => a.userId),
      formAnswers: proposalPage.proposal.formAnswers as FieldAnswerInput[],
      formFields
    },
    isDraft: false,
    project: proposalPage.proposal.project,
    requireTemplates: false
  });

  if (errors.length > 0 && !isAdmin) {
    throw new InvalidInputError(errors.join('\n'));
  }

  const currentEvaluationId = proposalPage?.proposal?.evaluations[0]?.id || null;

  await publishProposal({
    proposalId,
    userId
  });

  await publishProposalEventBase({
    proposalId,
    spaceId: proposalPage.spaceId,
    userId,
    scope: WebhookEventNames.ProposalPublished
  });

  if (currentEvaluationId) {
    await publishProposalEvent({
      proposalId,
      spaceId: proposalPage.spaceId,
      userId,
      currentEvaluationId
    });
  }

  trackUserAction('new_proposal_stage', {
    userId,
    pageId: proposalPage?.id || '',
    resourceId: proposalId,
    status: 'published',
    spaceId: proposalPage?.spaceId || ''
  });

  const spaceDomain = proposalPage.space.domain;

  if (spaceDomain === 'op-grants' && proposalPage.type === 'proposal') {
    trackOpUserAction('successful_proposal_creation', {
      proposalId,
      userId
    });
  }

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
