import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import { createProposal } from 'lib/proposal/createProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProposalController);

async function createProposalController(req: NextApiRequest, res: NextApiResponse<{ id: string }>) {
  const proposalCreateProps = req.body as CreateProposalInput;

  const adminRole = await prisma.spaceRole.findFirst({
    where: {
      isAdmin: true,
      userId: req.session.user.id,
      spaceId: proposalCreateProps.spaceId
    }
  });

  if (proposalCreateProps.pageProps?.type === 'proposal_template') {
    if (!adminRole) {
      throw new AdministratorOnlyError();
    }
  } else {
    const permissions = await permissionsApiClient.spaces.computeSpacePermissions({
      resourceId: proposalCreateProps.spaceId,
      userId: req.session.user.id
    });

    if (!permissions.createProposals) {
      throw new ActionNotPermittedError('You cannot create new proposals');
    }
    const space = await prisma.space.findUnique({
      where: {
        id: proposalCreateProps.spaceId
      }
    });
    if (space?.requireProposalTemplate && !proposalCreateProps.pageProps?.sourceTemplateId) {
      throw new ActionNotPermittedError('You must use a template to create new proposals');
    }
  }

  const proposalTemplate = proposalCreateProps.pageProps?.sourceTemplateId
    ? await prisma.page.findUnique({
        where: {
          id: proposalCreateProps.pageProps.sourceTemplateId
        },
        include: {
          proposal: {
            include: {
              evaluations: {
                include: { reviewers: true }
              }
            }
          }
        }
      })
    : null;

  // verify the input matches the template if not an admin
  if (!adminRole && proposalTemplate?.proposal) {
    const isValidEvaluationSteps = proposalTemplate.proposal.evaluations.every((evaluation, index) => {
      const matchingEvaluation = proposalCreateProps.evaluations[index];
      if (!matchingEvaluation) {
        return false;
      }
      if (matchingEvaluation.reviewers.length !== evaluation.reviewers.length) {
        return false;
      }
      return matchingEvaluation.reviewers.every((reviewer) =>
        evaluation.reviewers.some((evaluationReviewer) => evaluationReviewer.userId === reviewer.userId)
      );
    });
    if (!isValidEvaluationSteps) {
      throw new ActionNotPermittedError('Inputs do not match the template');
    }
  }
  // TODO: fix tests
  // if (!req.body.workflowId) {
  //   throw new InvalidInputError('You must provide a workflow ID');
  // }
  const proposalPage = await createProposal({
    ...req.body,
    userId: req.session.user.id
  });
  const pages = await getPageMetaList([proposalPage.page.id]);
  relay.broadcast(
    {
      type: 'pages_created',
      payload: pages
    },
    proposalPage.page.spaceId
  );

  return res.status(201).json({ id: proposalPage.proposal.id });
}

export default withSessionRoute(handler);
