import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalReviewerInput } from './createProposal';

export type ProposalUsersToValidate = {
  spaceId: string;
  authors: string[];
  reviewers: ProposalReviewerInput[];
};

export type ProposalUsersValidationResult = {
  valid: boolean;
  invalidAuthors: string[];
  invalidReviewers: ProposalReviewerInput[];
};

export async function validateProposalAuthorsAndReviewers({
  authors,
  reviewers,
  spaceId
}: ProposalUsersToValidate): Promise<ProposalUsersValidationResult> {
  const invalidAuthors: string[] = [];
  const invalidReviewers: ProposalReviewerInput[] = [];

  // Validate input for security purposes
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId,
      userId: {
        in: authors
      }
    },
    select: {
      userId: true
    }
  });

  for (const author of authors) {
    if (!spaceRoles.some((sr) => sr.userId === author)) {
      invalidAuthors.push(author);
    }
  }

  const userReviewers = reviewers.filter((reviewer) => reviewer.group === 'user');

  if (userReviewers.length > 0) {
    const userReviewerSpaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId,
        userId: {
          in: userReviewers.map((reviewer) => reviewer.id)
        }
      },
      select: {
        userId: true
      }
    });
    for (const userReviewer of userReviewers) {
      if (!userReviewerSpaceRoles.some((sr) => sr.userId === userReviewer.id)) {
        invalidReviewers.push(userReviewer);
      }
    }
  }

  const roleReviewers = reviewers.filter((reviewer) => reviewer.group === 'role');

  if (roleReviewers.length > 0) {
    // Double check each reviewer role belongs to space
    const roles = await prisma.role.findMany({
      where: {
        spaceId,
        id: {
          in: roleReviewers.map((reviewer) => reviewer.id)
        }
      }
    });

    for (const roleReviewer of roleReviewers) {
      if (!roles.some((role) => role.id === roleReviewer.id)) {
        invalidReviewers.push(roleReviewer);
      }
    }
  }

  const isValid = invalidAuthors.length === 0 && invalidReviewers.length === 0;

  return {
    valid: isValid,
    invalidAuthors,
    invalidReviewers
  };
}
