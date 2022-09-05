import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { ProposalWithUsers, UpdateProposalRequest } from './interface';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export async function updateProposal ({
  proposal,
  authors,
  reviewers
}: {
  proposal: ProposalWithUsers,
} & UpdateProposalRequest) {
  const { status, authors: existingAuthors, reviewers: existingReviewers } = proposal;

  const newAuthors = authors.filter(author => !existingAuthors.some(existingAuthor => existingAuthor.userId === author));
  const deletedAuthors = existingAuthors.filter(existingAuthor => !authors.some(author => existingAuthor.userId === author));

  const existingReviewerRoles = existingReviewers.filter(existingReviewer => existingReviewer.roleId);
  const existingReviewerUsers = existingReviewers.filter(existingReviewer => existingReviewer.userId);

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

  await prisma.$transaction([
    prisma.proposalAuthor.deleteMany({
      where: {
        proposalId: proposal.id
      }
    }),
    prisma.proposalAuthor.createMany({
      data: authors.map(author => ({ proposalId: proposal.id, userId: author }))
    })
  ]);

  const [deleteArgs, createArgs, childCreateArgs] = await generateSyncProposalPermissions({ proposalId: proposal.id });

  await prisma.$transaction([
    prisma.proposalReviewer.deleteMany({
      where: {
        proposalId: proposal.id
      }
    }),
    prisma.proposalReviewer.createMany({
      data: reviewers.map(reviewer => ({
        proposalId: proposal.id,
        userId: reviewer.group === 'user' ? reviewer.id : null,
        roleId: reviewer.group === 'role' ? reviewer.id : null
      }))
    }),
    prisma.pagePermission.deleteMany(deleteArgs),
    prisma.pagePermission.createMany(createArgs),
    prisma.pagePermission.createMany(childCreateArgs)
  ]);
}
