import { prisma } from '@charmverse/core/prisma-client';

export type UpdateProposalLensPropertiesRequest = {
  lensPostLink?: string | null;
  proposalId: string;
};

export async function updateProposalLensProperties({ lensPostLink, proposalId }: UpdateProposalLensPropertiesRequest) {
  await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      lensPostLink
    }
  });
}
