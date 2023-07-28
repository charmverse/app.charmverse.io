import type { Vote } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { deleteVote as deleteVoteService, getVote as getVoteService, updateVote as updateVoteService } from 'lib/votes';
import { getVote } from 'lib/votes/getVote';
import type { ExtendedVote, UpdateVoteDTO } from 'lib/votes/interfaces';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'vote'
    })
  )
  .get(getVoteController)
  .put(updateVote)
  .delete(deleteVote);

async function getVoteController(req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const vote = await getVoteService(voteId, req.session.user.id);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function updateVote(req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const update = req.body as Partial<UpdateVoteDTO>;
  const userId = req.session.user.id;

  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      pageId: true,
      postId: true,
      page: {
        select: {
          proposalId: true
        }
      }
    }
  });

  if (!vote) {
    throw new DataNotFoundError(`Cannot update vote as vote with id ${voteId} was not found.`);
  }

  if (vote.pageId) {
    if (vote.page?.proposalId) {
      const proposalPermissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
        userId,
        resourceId: vote.pageId
      });

      if (!proposalPermissions.create_vote) {
        throw new UnauthorisedActionError('You do not have permissions to update the vote.');
      }
    } else {
      const pagePermissions = await req.basePermissionsClient.pages.computePagePermissions({
        userId,
        resourceId: vote.pageId
      });

      if (!pagePermissions.create_poll) {
        throw new UnauthorisedActionError('You do not have permissions to update the vote.');
      }
    }
  } else if (vote.postId) {
    const postPermissions = await req.basePermissionsClient.forum.computePostPermissions({
      resourceId: vote.postId as string,
      userId
    });

    if (!postPermissions.edit_post) {
      throw new UnauthorisedActionError('You do not have permissions to update the vote.');
    }
  }

  await updateVoteService(voteId, userId, update);

  const updatedVote = (await getVote(voteId, userId)) as ExtendedVote;

  relay.broadcast(
    {
      type: 'votes_updated',
      payload: [updatedVote]
    },
    vote.spaceId
  );

  return res.status(200).json(updatedVote);
}

async function deleteVote(req: NextApiRequest, res: NextApiResponse<Vote | null | { error: any }>) {
  const voteId = req.query.id as string;

  const userId = req.session.user.id;

  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      pageId: true,
      postId: true
    }
  });

  if (!vote) {
    throw new DataNotFoundError(`Cannot delete vote as vote with id ${voteId} was not found.`);
  }

  if (vote.pageId) {
    const pagePermissions = await req.basePermissionsClient.pages.computePagePermissions({
      userId,
      resourceId: vote.pageId
    });

    if (!pagePermissions.create_poll) {
      throw new UnauthorisedActionError('You do not have permissions to delete the vote.');
    }
  } else if (vote.postId) {
    const postPermissions = await req.basePermissionsClient.forum.computePostPermissions({
      resourceId: vote.postId as string,
      userId
    });

    if (!postPermissions.edit_post) {
      throw new UnauthorisedActionError('You do not have permissions to delete the vote.');
    }
  }
  const deletedVote = await deleteVoteService(voteId, req.session.user.id);

  relay.broadcast(
    {
      type: 'votes_deleted',
      payload: [{ id: vote.id }]
    },
    vote.spaceId
  );

  return res.status(200).json(deletedVote);
}

export default withSessionRoute(handler);
