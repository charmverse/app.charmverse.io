import { prisma } from '@charmverse/core/prisma-client';
import { getProposalsReviewers } from '@packages/lib/proposals/getProposalsReviewers';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(exportProposalsReviewersController).use(
  requireSpaceMembership({
    adminOnly: true,
    spaceIdKey: 'id'
  })
);

async function exportProposalsReviewersController(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const proposalsReviewers = await getProposalsReviewers({ spaceId });
  const reviewerUserIds = proposalsReviewers.map((reviewer) => reviewer.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: reviewerUserIds
      }
    },
    select: {
      username: true,
      email: true,
      id: true
    }
  });
  const usersRecord = users.reduce<Record<string, { username: string; email: string | null }>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  let csvContent = '';
  const rows: string[][] = [['Reviewer (email)', 'Reviewer (username)', 'Proposals to review']];

  proposalsReviewers.forEach((proposalsReviewer) => {
    const reviewer = usersRecord[proposalsReviewer.userId];
    if (reviewer) {
      rows.push([reviewer.email || 'N/A', reviewer.username, proposalsReviewer.reviewsLeft.toString()]);
    }
  });

  rows.forEach((row) => {
    const encodedRow = row.join('\t');
    csvContent += `${encodedRow}\r\n`;
  });

  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
