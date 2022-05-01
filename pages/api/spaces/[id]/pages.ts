
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<Page[]>) {

  const spaceId = req.query.id as string;
  const deletedPage = req.query.deleted ? (req.query.deleted as string) === 'true' : false;
  const userId = req.session.user.id;

  const pages = await prisma.page.findMany({
    where: {
      deletedAt: deletedPage ? {
        not: null
      } : null,
      OR: [
        {
          spaceId,
          permissions: {
            some: {
              OR: [
                {
                  role: {
                    spaceRolesToRole: {
                      some: {
                        spaceRole: {
                          userId
                        }
                      }
                    }
                  }
                },
                {
                  userId
                },
                {
                  spaceId
                }
              ]
            }
          }
        },
        {
          space: {
            id: spaceId,
            spaceRoles: {
              some: {
                OR: [{
                  userId,
                  isAdmin: true
                }, {
                  userId,
                  role: 'admin'
                }]
              }
            }
          }
        }
      ]
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  return res.status(200).json(pages);
}

export default withSessionRoute(handler);
