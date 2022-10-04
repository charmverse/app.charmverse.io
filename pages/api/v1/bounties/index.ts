
import type { BountyStatus } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(getBounties);

/**
 * @swagger
 * components:
 *  schemas:
 *    UserWallet:
 *      type: object
 *      properties:
 *        address:
 *          type: string
 *          example: 0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE
 *    Bounty:
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
 *        description:
 *          type: string
 *          example: Create a story on Instagram
 *        issuer:
 *          type: object
 *          $ref: '#/components/schemas/UserWallet'
 *        recipients:
 *          type: array
 *          items:
 *            type: object
 *            $ref: '#/components/schemas/UserWallet'
 *        reward:
 *          type: object
 *          properties:
 *            amount:
 *              type: number
 *              example: .001
 *            chain:
 *              type: number
 *              example: 1
 *            token:
 *              type: string
 *              example: ETH
 *        status:
 *          type: string
 *          example: paid
 *          enum:
 *            - suggestion
 *            - open
 *            - inProgress
 *            - complete
 *            - paid
 *        title:
 *          type: string
 *          example: Social media boost
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/my-workspace/bounties/5985679461310778
 *
 */
export interface PublicApiBounty {
  id: string;
  createdAt: string;
  description: string;
  issuer: {
    address: string;
  };
  reward: {
    amount: number;
    chain: number;
    token: string;
  };
  status: BountyStatus;
  title: string;
  url: string;
  recipients: {
    address: string;
  }[];
}

interface BountyVC {
  id: string;
  action: string; // created, started, completed
  actionDate: string;
  description: string;
  rewardAmount: number;
  rewardChain: number;
  rewardToken: string;
  title: string;
  url: string;
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
 *        type: string
 *     responses:
 *       200:
 *         description: List of bounties
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  $ref: '#/components/schemas/Bounty'
 */
async function getBounties (req: NextApiRequest, res: NextApiResponse) {

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
      author: {
        include: {
          wallets: true
        }
      },
      applications: true,
      space: true,
      page: true
    }
  });

  /**
   * Returns the wallet addresses that have received a payment for this bounty
   */
  function getRecipients (bounty: (typeof bounties)[number]) {
    return bounty.applications
      .filter(application => application.status === 'paid' && application.walletAddress)
      .map(application => ({
        address: application.walletAddress as string
      }));
  }

  function getUrl (bounty: (typeof bounties)[number]) {
    return `${process.env.DOMAIN}/${bounty.space.domain}/bounties/${bounty.id}`;
  }

  const bountiesResponse = bounties.map((bounty): PublicApiBounty => ({
    createdAt: bounty.createdAt.toISOString(),
    description: bounty.page?.contentText || '',
    id: bounty.id,
    issuer: {
      address: bounty.author.wallets[0]?.address
    },
    recipients: getRecipients(bounty),
    reward: {
      amount: bounty.rewardAmount,
      chain: bounty.chainId,
      token: bounty.rewardToken
    },
    title: bounty.page?.title || 'Untitled',
    status: bounty.status,
    url: getUrl(bounty)
  }));

  return res.status(200).json(bountiesResponse);
}

export default handler;
