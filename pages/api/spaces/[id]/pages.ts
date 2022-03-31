
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

  const userId = req.session.user.id;

  const pages = await prisma.page.findMany({
    where: {
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
      permissions: true
    }
  });

  if (spaceId === 'eed82490-f0bd-4cf8-8651-775b666947e5') {
    console.log('Pages found', pages.length);
  }

  return res.status(200).json(pages);
}

export default withSessionRoute(handler);
