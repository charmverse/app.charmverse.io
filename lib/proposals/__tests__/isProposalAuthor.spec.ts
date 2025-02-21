import { isProposalAuthor } from '@charmverse/core/permissions';
import type { Space, User, Role } from '@charmverse/core/prisma';
import { generateUserAndSpace, generateSpaceUser, generateRole } from '@packages/testing/setupDatabase';
import { generateProposal } from '@packages/testing/utils/proposals';

let proposal: Awaited<ReturnType<typeof generateProposal>>;
let space: Space;
let originalProposalAuthor: User;
let secondProposalAuthor: User;
let proposalReviewer: User;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });

  space = generated.space;
  originalProposalAuthor = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  secondProposalAuthor = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  proposalReviewer = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  role = await generateRole({
    createdBy: generated.user.id,
    spaceId: space.id
  });

  proposal = await generateProposal({
    // Don't explicitly add the proposal author as an author
    authors: [secondProposalAuthor.id],
    proposalStatus: 'draft',
    spaceId: space.id,
    userId: originalProposalAuthor.id
  });
});

describe('isProposalAuthor', () => {
  it('should return true if proposal.createdBy matches the user id', () => {
    const isAuthor = isProposalAuthor({
      proposal,
      userId: originalProposalAuthor.id
    });
    expect(isAuthor).toBe(true);
  });

  it('should return true if user is listed as an author for the proposal', () => {
    const isAuthor = isProposalAuthor({
      proposal,
      userId: secondProposalAuthor.id
    });
    expect(isAuthor).toBe(true);
  });

  it('should return false if user is not an author for the proposal', () => {
    const isReviewer = isProposalAuthor({
      proposal,
      userId: proposalReviewer.id
    });
    expect(isReviewer).toBe(false);
  });
});
