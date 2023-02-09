import { prisma } from 'db';

export async function convertPostToProposal({ postId, proposalId }: { postId: string; proposalId: string }) {
  await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      proposalId
    }
  });
}
