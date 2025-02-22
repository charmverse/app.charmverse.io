import type { BountyStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { resolveENSName } from '@packages/blockchain/getENSName';
import { isTruthy } from '@packages/utils/types';
import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';
import { apiHandler } from 'lib/public-api/handler';

const handler = apiHandler();

handler.get(getRewards);

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
 *          example: https://app.charmverse.io/my-workspace/getting-started-5985679461310778
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

/**
 * @swagger
 * /rewards:
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
async function getRewards(req: NextApiRequest, res: NextApiResponse) {
  const { status } = req.query;
  const statuses = (Array.isArray(status) ? status : status ? [status] : null) as BountyStatus[];

  const spaceId = req.authorizedSpaceId;

  const rewards = await prisma.bounty
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
    .then((_rewards) => _rewards.filter((b) => !b.page?.deletedAt));

  /**
   * Returns the wallet addresses that have received a payment for this reward
   */
  function getRecipients(reward: (typeof rewards)[number]) {
    return reward.applications
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

  function getUrl(reward: (typeof rewards)[number]) {
    return `${process.env.DOMAIN}/${reward.space.domain}/${reward.id}`;
  }

  const markdown: string[] = [];

  for (const reward of rewards) {
    try {
      const markdownText = await generateMarkdown({
        content: reward.page?.content ?? { type: 'doc', content: [] }
      });
      markdown.push(markdownText);
    } catch {
      markdown.push('markdown not available');
    }
  }

  const rewardsResponse: PublicApiReward[] = [];
  let index = 0;
  for (const reward of rewards) {
    const rewardResponse: PublicApiReward = {
      createdAt: reward.createdAt.toISOString(),
      content: {
        text: reward.page?.contentText ?? '',
        markdown: markdown[index]
      },
      id: reward.id,
      issuer: {
        address: reward.author.wallets[0]?.address
      },
      recipients: (await Promise.all(getRecipients(reward))).filter(isTruthy),
      reward: {
        amount: reward.rewardAmount,
        chain: reward.chainId,
        token: reward.rewardToken,
        custom: reward.customReward
      },
      title: reward.page?.title ?? 'Untitled',
      status: reward.status,
      url: getUrl(reward)
    };
    index += 1;
    rewardsResponse.push(rewardResponse);
  }

  return res.status(200).json(rewardsResponse);
}

export default handler;
