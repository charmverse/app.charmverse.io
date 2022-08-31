import { PrismaPromise } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { ProposalWithUsers } from './interface';

export async function updateProposal ({
  proposal,
  authors,
  reviewers
}: {
  proposal: ProposalWithUsers,
  authors: string[],
  reviewers: string[]
}) {
  const { status, id: proposalId, authors: existingAuthors, reviewers: existingReviewers } = proposal;

  const newAuthors = authors.filter(author => !existingAuthors.some(existingAuthor => existingAuthor.userId === author));
  const deletedAuthors = existingAuthors.filter(existingAuthor => !authors.some(author => existingAuthor.userId === author));

  const newReviewers = reviewers.filter(reviewer => !existingReviewers.some(existingReviewer => existingReviewer.userId === reviewer));
  const deletedReviewers = existingReviewers.filter(existingReviewer => !reviewers.some(reviewer => existingReviewer.userId === reviewer));

  const transactionPipeline: PrismaPromise<any>[] = [];

  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have atleast 1 author');
  }

  // Updating authors should fail if proposal is in review state or later
  if (status !== 'draft' && status !== 'private_draft' && status !== 'discussion' && (newAuthors.length !== 0 || deletedAuthors.length !== 0)) {
    throw new UnauthorisedActionError();
  }

  // Updating reviewers should fail if proposal is in "discussion" stage or later
  if (status !== 'draft' && status !== 'private_draft' && (newReviewers.length !== 0 || deletedReviewers.length !== 0)) {
    throw new UnauthorisedActionError();
  }

  if (newAuthors.length) {
    transactionPipeline.push(
      prisma.proposalAuthor.createMany({
        data: newAuthors.map(author => ({ proposalId, userId: author }))
      })
    );
  }

  if (deletedAuthors.length) {
    transactionPipeline.push(
      prisma.proposalAuthor.deleteMany({
        where: {
          proposalId,
          userId: {
            in: deletedAuthors.map(deletedAuthor => deletedAuthor.userId)
          }
        }
      })
    );
  }

  if (newReviewers.length) {
    transactionPipeline.push(
      prisma.proposalReviewer.createMany({
        data: newReviewers.map(reviewer => ({ proposalId, userId: reviewer }))
      })
    );
  }

  if (deletedReviewers.length) {
    transactionPipeline.push(
      prisma.proposalReviewer.deleteMany({
        where: {
          proposalId,
          userId: {
            in: deletedReviewers.map(deletedReviewer => deletedReviewer.userId)
          }
        }
      })
    );
  }

  await prisma.$transaction(transactionPipeline);
}
