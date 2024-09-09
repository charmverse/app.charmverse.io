import type { FavoritePage } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { updateFavoritePages } from 'lib/users/updateFavoritePages';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(updateFavoritePagesHandler)
  .delete(unFavoritePage)
  .use((req, res, next) => {
    if (!req.body.pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }
    next();
  })
  .post(addFavoritePage);

async function addFavoritePage(req: NextApiRequest, res: NextApiResponse<Partial<LoggedInUser> | { error: any }>) {
  const pageId = req.body.pageId as string;
  const user = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      favorites: {
        connectOrCreate: {
          where: {
            pageId_userId: {
              pageId,
              userId: req.session.user.id
            }
          },
          create: {
            pageId
          }
        }
      }
    },
    include: sessionUserRelations
  });
  return res.status(200).json(user);
}

async function unFavoritePage(req: NextApiRequest, res: NextApiResponse<Partial<LoggedInUser> | { error: any }>) {
  // remove use of req.body after browsers update - 06/2023
  const pageId = (req.query || req.body).pageId as string;
  const user = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      favorites: {
        delete: {
          pageId_userId: {
            pageId,
            userId: req.session.user.id
          }
        }
      }
    },
    include: sessionUserRelations
  });
  return res.status(200).json(user);
}

async function updateFavoritePagesHandler(req: NextApiRequest, res: NextApiResponse<FavoritePage[]>) {
  const favoritePages = req.body as FavoritePage[];
  const userId = req.session.user.id;

  const updatedFavorites = await updateFavoritePages({ favoritePages, userId });

  return res.status(200).json(updatedFavorites);
}

export default withSessionRoute(handler);
