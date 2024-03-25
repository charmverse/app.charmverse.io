import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import { issueProposalCredentialsIfNecessary } from 'lib/credentials/issueProposalCredentialsIfNecessary';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { checkProposalProject } from 'lib/proposals/checkProposalProject';
import { getProposalErrors } from 'lib/proposals/getProposalErrors';
import { publishProposal } from 'lib/proposals/publishProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishProposalStatusController);

async function publishProposalStatusController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.move) {
    throw new ActionNotPermittedError(`You do not have permission to publish this proposal`);
  }

  const proposalPage = await prisma.page.findUniqueOrThrow({
    where: {
      proposalId
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      proposal: {
        include: {
          authors: true,
          formAnswers: true,
          evaluations: {
            include: {
              reviewers: true,
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
          }
        }
      },
      spaceId: true
    }
  });
  const { isAdmin } = await hasAccessToSpace({
    spaceId: proposalPage.spaceId,
    userId,
    adminOnly: false
  });

  const isProposalArchived = proposalPage.proposal?.archived || false;
  if (isProposalArchived) {
    throw new ActionNotPermittedError(`You cannot publish an archived proposal`);
  }

  const errors = getProposalErrors({
    page: {
      title: proposalPage.title ?? '',
      type: proposalPage.type,
      content: proposalPage.content
    },
    proposalType: proposalPage.proposal?.formId ? 'structured' : 'free_form',
    proposal: {
      ...proposalPage.proposal!,
      evaluations: proposalPage.proposal!.evaluations.map((e) => ({
        ...e,
        voteSettings: e.voteSettings as any,
        rubricCriteria: e.rubricCriteria as any[]
      })),
      authors: proposalPage.proposal!.authors.map((a) => a.userId),
      formAnswers: proposalPage.proposal!.formAnswers as unknown as FieldAnswerInput[],
      formFields: proposalPage.proposal!.form?.formFields as unknown as FormFieldInput[]
    },
    isDraft: false,
    requireTemplates: false
  });

  if (errors.length > 0 && !isAdmin) {
    throw new InvalidInputError(errors.join('\n'));
  }

  const currentEvaluationId = proposalPage?.proposal?.evaluations[0]?.id || null;

  const proposalForm = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      formAnswers: {
        select: {
          fieldId: true,
          value: true
        }
      },
      form: {
        select: {
          formFields: {
            select: {
              fieldConfig: true,
              id: true,
              type: true
            }
          }
        }
      }
    }
  });

  await checkProposalProject({
    formAnswers: proposalForm?.formAnswers as FieldAnswerInput[],
    formFields: proposalForm?.form?.formFields
  });

  await publishProposal({
    proposalId,
    userId
  });

  if (proposalPage && currentEvaluationId) {
    await publishProposalEvent({
      proposalId,
      spaceId: proposalPage.spaceId,
      userId,
      currentEvaluationId
    });
  }

  await issueProposalCredentialsIfNecessary({
    event: 'proposal_created',
    proposalId
  });

  trackUserAction('new_proposal_stage', {
    userId,
    pageId: proposalPage?.id || '',
    resourceId: proposalId,
    status: 'published',
    spaceId: proposalPage?.spaceId || ''
  });

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
