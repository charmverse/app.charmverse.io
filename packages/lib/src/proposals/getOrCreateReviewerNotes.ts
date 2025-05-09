import { prisma } from '@charmverse/core/prisma-client';

export type GetOrCreateReviewerNotesResponse = { pageId: string };
// takes a proposalId and returns the reviewer notes pageId
export async function getOrCreateReviewerNotes({
  userId,
  proposalId
}: {
  userId: string;
  proposalId: string;
}): Promise<GetOrCreateReviewerNotesResponse> {
  const proposalPage = await prisma.page.findFirstOrThrow({
    where: {
      proposal: {
        id: proposalId
      }
    },
    select: {
      id: true,
      spaceId: true
    }
  });
  const reviewerNotesPage = await prisma.page.findFirst({
    where: {
      parentId: proposalPage.id
    },
    select: {
      id: true
    }
  });
  if (reviewerNotesPage) {
    return { pageId: reviewerNotesPage.id };
  }
  const { id } = await prisma.page.create({
    data: {
      createdBy: userId,
      updatedBy: userId,
      parentId: proposalPage.id,
      contentText: '',
      title: 'Reviewer Notes', // not for display, but just for analytics, etc.
      path: `reviewer-notes-${Math.random().toString(36).substring(7)}`,
      spaceId: proposalPage.spaceId,
      type: 'proposal_notes'
    },
    select: {
      id: true
    }
  });
  return { pageId: id };
}
