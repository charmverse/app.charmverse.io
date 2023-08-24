import { prisma } from '@charmverse/core/prisma-client';

export type UpdateProposalLensPropertiesRequest = {
  publishToLens?: boolean | null;
  lensPostLink?: string | null;
  proposalId: string;
};

export async function updateProposalLensProperties({
  lensPostLink,
  publishToLens,
  proposalId
}: UpdateProposalLensPropertiesRequest) {
  await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      lensPostLink,
      publishToLens
    }
  });
}
