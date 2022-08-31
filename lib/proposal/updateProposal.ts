import { PrismaPromise, ProposalReviewerGroup } from '@prisma/client';
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
  reviewers: {
    id: string,
    group: ProposalReviewerGroup
  }[]
}) {
  const { status, id: proposalId, authors: existingAuthors, reviewers: existingReviewers } = proposal;

  const newAuthors = authors.filter(author => !existingAuthors.some(existingAuthor => existingAuthor.userId === author));
  const deletedAuthors = existingAuthors.filter(existingAuthor => !authors.some(author => existingAuthor.userId === author));

  const existingReviewerRoles = existingReviewers.filter(existingReviewer => existingReviewer.roleId && existingReviewer.group === 'role');
  const existingReviewerUsers = existingReviewers.filter(existingReviewer => existingReviewer.userId && existingReviewer.group === 'user');

  const reviewerRoles = reviewers.filter(reviewer => reviewer.group === 'role');
  const reviewerUsers = reviewers.filter(reviewer => reviewer.group === 'user');

  const newReviewerRoles = reviewerRoles
    .filter(reviewer => !existingReviewerRoles
      .some(existingReviewer => (existingReviewer.roleId === reviewer.id)));
  const newReviewerUsers = reviewerUsers
    .filter(reviewer => !existingReviewerUsers
      .some(existingReviewer => (existingReviewer.userId === reviewer.id)));

  const deletedReviewerRoles = existingReviewerRoles
    .filter(existingReviewer => !reviewerRoles
      .some(reviewer => (existingReviewer.roleId === reviewer.id)));
  const deletedReviewerUsers = existingReviewerUsers
    .filter(existingReviewer => !reviewerUsers
      .some(reviewer => (existingReviewer.userId === reviewer.id)));

  const transactionPipeline: PrismaPromise<any>[] = [];

  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have atleast 1 author');
  }

  // Updating authors should fail if proposal is in review state or later
  if (status !== 'draft' && status !== 'private_draft' && status !== 'discussion' && (newAuthors.length !== 0 || deletedAuthors.length !== 0)) {
    throw new UnauthorisedActionError();
  }

  // Updating reviewers should fail if proposal is in "discussion" stage or later
  if (status !== 'draft' && status !== 'private_draft' && (newReviewerRoles.length !== 0 || newReviewerUsers.length !== 0 || deletedReviewerRoles.length !== 0 || deletedReviewerUsers.length !== 0)) {
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

  if (newReviewerRoles.length) {
    transactionPipeline.push(
      prisma.proposalReviewer.createMany({
        data: newReviewerRoles.map(reviewer => ({ proposalId, roleId: reviewer.id, group: 'role' }))
      })
    );
  }

  if (newReviewerUsers.length) {
    transactionPipeline.push(
      prisma.proposalReviewer.createMany({
        data: newReviewerUsers.map(reviewer => ({ proposalId, userId: reviewer.id, group: 'user' }))
      })
    );
  }

  if (deletedReviewerRoles.length) {
    transactionPipeline.push(
      prisma.proposalReviewer.deleteMany({
        where: {
          proposalId,
          roleId: {
            in: deletedReviewerRoles.map(deletedReviewer => deletedReviewer.roleId as string)
          }
        }
      })
    );
  }

  if (deletedReviewerUsers.length) {
    transactionPipeline.push(
      prisma.proposalReviewer.deleteMany({
        where: {
          proposalId,
          userId: {
            in: deletedReviewerUsers.map(deletedReviewer => deletedReviewer.userId as string)
          }
        }
      })
    );
  }

  await prisma.$transaction(transactionPipeline);
}
