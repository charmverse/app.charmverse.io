import type { BountyStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

import { resolveENSName } from 'lib/blockchain';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';
import { apiHandler } from 'lib/public-api/handler';
import { isTruthy } from 'lib/utils/types';

const handler = apiHandler();

handler.get(getBounties);

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
 *    Reward:
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
 *        content:
 *          type: object
 *          properties:
 *            text:
 *              type: string
 *            markdown:
 *              type: string
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
export interface PublicApiReward {
  id: string;
  createdAt: string;
  content: {
    text: string;
    markdown: string;
  };
  issuer: {
    address: string;
  };
  reward: {
    amount: number | null;
    chain: number | null;
    token: string | null;
    custom: string | null;
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
 *     summary: Retrieve a list of rewards
 *     description: Retrieve rewards from your space.
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - in: query
 *        name: status
 *        type: string
 *     responses:
 *       200:
 *         description: List of rewards
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  $ref: '#/components/schemas/Reward'
 */
async function getBounties(req: NextApiRequest, res: NextApiResponse) {
  const { status } = req.query;
  const statuses = (Array.isArray(status) ? status : status ? [status] : null) as BountyStatus[];

  const spaceId = req.authorizedSpaceId;

  const bounties = await prisma.bounty
    .findMany({
      where: {
        spaceId,
        status: statuses
          ? {
              in: statuses
            }
          : undefined
      },
      include: {
        author: {
          include: {
            wallets: true
          }
        },
        applications: true,
        space: true,
        page: {
          select: {
            path: true,
            createdAt: true,
            title: true,
            content: true,
            contentText: true,
            deletedAt: true
          }
        }
      }
    })
    // Make the API response faster by avoiding a join operation on the database, and filtering the results
    .then((_bounties) => _bounties.filter((b) => !b.page?.deletedAt));

  /**
   * Returns the wallet addresses that have received a payment for this bounty
   */
  function getRecipients(bounty: (typeof bounties)[number]) {
    return bounty.applications
      .filter((application) => application.status === 'paid' && application.walletAddress)
      .map(async (application) => {
        if (!application.walletAddress) {
          return null;
        } else if (
          application.walletAddress &&
          application.walletAddress.endsWith('.eth') &&
          ethers.utils.isValidName(application.walletAddress)
        ) {
          const resolvedWalletAddress = await resolveENSName(application.walletAddress);

          if (!resolvedWalletAddress) {
            return null;
          }

          return {
            address: resolvedWalletAddress
          };
        }

        return {
          address: application.walletAddress
        };
      });
  }

  function getUrl(bounty: (typeof bounties)[number]) {
    return `${process.env.DOMAIN}/${bounty.space.domain}/bounties/${bounty.id}`;
  }

  const markdown: string[] = [];

  for (const bounty of bounties) {
    try {
      const markdownText = await generateMarkdown({
        content: bounty.page?.content ?? { type: 'doc', content: [] }
      });
      markdown.push(markdownText);
    } catch {
      markdown.push('markdown not available');
    }
  }

  const bountiesResponse: PublicApiReward[] = [];
  let index = 0;
  for (const bounty of bounties) {
    const bountyResponse: PublicApiReward = {
      createdAt: bounty.createdAt.toISOString(),
      content: {
        text: bounty.page?.contentText ?? '',
        markdown: markdown[index]
      },
      id: bounty.id,
      issuer: {
        address: bounty.author.wallets[0]?.address
      },
      recipients: (await Promise.all(getRecipients(bounty))).filter(isTruthy),
      reward: {
        amount: bounty.rewardAmount,
        chain: bounty.chainId,
        token: bounty.rewardToken,
        custom: bounty.customReward
      },
      title: bounty.page?.title ?? 'Untitled',
      status: bounty.status,
      url: getUrl(bounty)
    };
    index += 1;
    bountiesResponse.push(bountyResponse);
  }

  return res.status(200).json(bountiesResponse);
}

export default handler;
