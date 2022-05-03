
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { PageContent } from 'models';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { ThreadWithComments } from '../pages/[id]/threads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys(['context', 'pageId', 'content'], 'body'), startThread);

export interface StartThreadRequest {
  content: PageContent,
  pageId: string,
  context: string
}

async function startThread (req: NextApiRequest, res: NextApiResponse<ThreadWithComments>) {

  const { content, context, pageId } = req.body as StartThreadRequest;

  const userId = req.session.user.id;

  const permissionSet = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    throw new ActionNotPermittedError();
  }

  // Get the space from the page, that way we dont need to pass the space id
  // Furthermore it mitigates the possibility of sending a different space where the page is not located
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      space: {
        select: {
          id: true
        }
      }
    }
  });

  const thread = await prisma.thread.create({
    data: {
      resolved: false,
      context,
      page: {
        connect: {
          id: pageId
        }
      },
      user: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: page?.space?.id
        }
      }
    }
  });

  const comment = await prisma.comment.create({
    data: {
      content,
      thread: {
        connect: {
          id: thread.id
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
      },
      space: {
        connect: {
          id: page?.space?.id
        }
      }
    },
    include: {
      user: true
    }
  });

  return res.status(200).json({ ...thread, comments: [comment] });
}

export default withSessionRoute(handler);
