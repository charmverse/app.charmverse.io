
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { PageContent } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys(['content'], 'body'), addComment);

export interface AddCommentRequest {
  content: PageContent
  threadId: string
  pageId: string
}

async function addComment (req: NextApiRequest, res: NextApiResponse) {
  const { pageId, threadId, content } = req.body as AddCommentRequest;
  const userId = req.session.user.id;

  const permissionSet = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      thread: {
        connect: {
          id: threadId
        }
      },
      page: {
        connect: {
          id: pageId
        }
      },
      user: {
        connect: {
          id: userId
        }
      }
    },
    include: {
      user: true
    }
  });

  return res.status(200).json(comment);
}

export default withSessionRoute(handler);
