
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { migrateBountyReviewers } from 'scripts/migrateBountyReviewers';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(runCommand)
  .post(runCommand);

async function runCommand (req: NextApiRequest, res: NextApiResponse) {

  // const bounties = await prisma.bounty.findMany({
  //   take: 57
  // });

  // await prisma.bounty.updateMany({
  //   where: {
  //     OR: bounties.map(b => {
  //       return {
  //         id: b.id
  //       };
  //     })
  //   },
  //   data: {
  //     reviewer: '89ad2fd4-1f9d-4ac3-a3ec-d3a395c88de6'
  //   }
  // });

  await migrateBountyReviewers(0);

  res.status(200).json({
    msg: 'hello'
  });
}

export default withSessionRoute(handler);
