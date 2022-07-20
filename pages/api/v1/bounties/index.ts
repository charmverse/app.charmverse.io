
import { prisma } from 'db';
import { BountyStatus, Prisma } from '@prisma/client';
import { onError, onNoMatch, requireApiKey, requireKeys } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Page, validateCreationData, DatabasePageNotFoundError, createDatabaseCardPage } from 'lib/public-api';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(requireKeys<Page>(['title'], 'body'))
  .use(getBounties);

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    DatabasePage:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        type:
 *          type: string
 *          example: board
 *        title:
 *          type: string
 *          example: Todo tracker
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/my-workspace/page-5985679461310778
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            $ref: '#/components/schemas/Bounty'
 *
 */
interface Bounty {
  id: string;
  url: string;
  createdAt: string;
  description: string;
  reward: {
    amount: number;
    chain: number;
    token: string;
  };
  status: BountyStatus;
  title: string;
  issuer: {
    address: string
  };
  recipients: {
    address: string
  }[];
}

/**
 * @swagger
 * /bounties:
 *   get:
 *     summary: Retrieve a list of bounties
 *     description: Retrieve bounties from your workspace.
 *     parameters:
 *      - in: query
 *        name: status
 *        schema:
 *          type: string
 *        description: Filter bounties by one or more status: suggestion | open | inProgress | complete | paid
 *     responses:
 *       200:
 *         description: List of bounties
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Bounty'
 */
export async function getBounties (req: NextApiRequest, res: NextApiResponse) {

  const { status } = req.query;
  const statuses = (Array.isArray(status) ? status : (status ? [status] : null)) as BountyStatus[];

  const spaceId = req.authorizedSpaceId;

  const bounties = await prisma.bounty.findMany({
    where: {
      spaceId,
      status: statuses ? {
        in: statuses
      } : undefined
    },
    include: {
      author: true,
      applications: true,
      space: true
    }
  });

  function getRecipients (bounty: (typeof bounties)[number]) {
    return bounty.applications
      .filter(application => application.status === 'paid' && application.walletAddress)
      .map(application => ({
        address: application.walletAddress as string
      }));
  }

  function getUrl (bounty: (typeof bounties)[number]) {
    return `${process.env.DOMAIN}/${bounty.space.domain}/bounties/${bounty.id}}`;
  }

  const bountiesResponse = bounties.map((bounty): Bounty => ({
    createdAt: bounty.createdAt.toISOString(),
    description: bounty.description,
    id: bounty.id,
    issuer: {
      address: bounty.author.addresses[0]
    },
    recipients: getRecipients(bounty),
    reward: {
      amount: bounty.rewardAmount,
      chain: bounty.chainId,
      token: bounty.rewardToken
    },
    title: bounty.title,
    status: bounty.status,
    url: getUrl(bounty)
  }));

  return res.status(201).json(bountiesResponse);
}

export default handler;
