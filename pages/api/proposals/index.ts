
import { Proposal, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getProposals).post(createProposal);

async function getProposals (req: NextApiRequest, res: NextApiResponse<Proposal[]>) {
  const { bountyId } = req.query;

  if (bountyId === undefined) {
    return res.status(406).send({ error: 'Please provide a valid bounty ID' } as any);
  }

  const ProposalListQuery: Prisma.ProposalFindManyArgs = {
    where: {
      bountyId: bountyId as string
    }
  };

  const bounties = await prisma.proposal.findMany(ProposalListQuery);
  return res.status(200).json(bounties);
}

async function createProposal (req: NextApiRequest, res: NextApiResponse<Proposal>) {
  const data = req.body as Proposal;
  const ProposalToCreate = { ...data } as any;

  if (data.applicantId) {
    (ProposalToCreate as Prisma.ProposalCreateInput).applicant = { connect: { id: data.applicantId } };
    delete ProposalToCreate.applicantId;
  }
  else {
    return res.status(406).json({ error: 'Please provide an applicant' } as any);
  }

  if (data.bountyId) {
    (ProposalToCreate as Prisma.ProposalCreateInput).bounty = { connect: { id: data.bountyId } };
    delete ProposalToCreate.bountyId;
  }
  else {
    return res.status(406).json({ error: 'The proposal should be linked to a bounty' } as any);
  }

  const proposal = await prisma.proposal.create({ data: ProposalToCreate });
  return res.status(200).json(proposal);
}

export default withSessionRoute(handler);
