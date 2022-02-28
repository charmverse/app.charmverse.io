
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IEventToLog, postToDiscord } from 'lib/logs/notifyDiscord';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPage);

async function createPage (req: NextApiRequest, res: NextApiResponse<Page>) {
  const data = req.body as Prisma.PageCreateInput;
  const page = await prisma.page.create({ data });
  logFirstWorkspacePageCreation(page);
  return res.status(200).json(page);
}

export default withSessionRoute(handler);

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstWorkspacePageCreation (page: Page) {
  const pages = await prisma.page.count({
    where: {
      spaceId: page.spaceId
    }
  });

  // Default page plus the just created page
  if (pages === 2) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_workspace_create_page',
      funnelStage: 'activation',
      message: `First page created in ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}
