import { builders as _ } from 'prosemirror-test-builder';

import { createProposal } from 'lib/proposal/createProposal';
import { createProposalCategory } from 'lib/proposal/createProposalCategory';
import { assignRole } from 'lib/roles';
import { createPage, generateUserAndSpace } from 'testing/setupDatabase';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createThread } from '../createThread';
import { getPageThreads } from '../getPageThreads';

describe('getPageThreads', () => {
  it(`Should get page threads based on space wide access`, async () => {
    const { user: adminUser, space } = await generateUserAndSpace({
      isAdmin: true
    });

    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: space.id
    });

    const spaceVisibleThread = await createThread({
      accessGroup: {
        group: 'space',
        id: space.id
      },
      comment: 'Comment',
      context: 'Context',
      pageId: page.id,
      userId: adminUser.id
    });

    await createThread({
      accessGroup: {
        group: 'reviewers',
        id: null
      },
      comment: 'Comment',
      context: 'Context',
      pageId: page.id,
      userId: adminUser.id
    });

    const pageThreads = await getPageThreads({
      pageId: page.id,
      userId: user2.id
    });

    expect(pageThreads.map((pageThread) => pageThread.id)).toStrictEqual([spaceVisibleThread.id]);
  });

  it(`Should get page threads based on proposal reviewer access`, async () => {
    const { user: adminUser, space } = await generateUserAndSpace({
      isAdmin: true
    });

    const roleBasedProposalReviewer = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: roleBasedProposalReviewer.id
    });

    const idBasedProposalReviewer = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: idBasedProposalReviewer.id
    });

    const nonProposalReviewer = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: nonProposalReviewer.id
    });

    const role = await createRole({
      spaceId: space.id
    });

    await assignRole({
      roleId: role.id,
      userId: roleBasedProposalReviewer.id
    });

    const category = await createProposalCategory({
      data: {
        spaceId: space.id,
        title: 'Proposal category'
      }
    });

    const proposal = await createProposal({
      categoryId: category.id,
      spaceId: space.id,
      userId: adminUser.id,
      reviewers: [
        {
          group: 'role',
          id: role.id
        },
        {
          group: 'user',
          id: idBasedProposalReviewer.id
        }
      ]
    });

    const proposalPageId = proposal.page.id;

    const proposalReviewersVisibleThread = await createThread({
      accessGroup: {
        group: 'reviewers',
        id: null
      },
      comment: 'Comment',
      context: 'Context',
      pageId: proposalPageId,
      userId: adminUser.id
    });

    const roleBasedProposalReviewerThreads = await getPageThreads({
      pageId: proposalPageId,
      userId: roleBasedProposalReviewer.id
    });

    const idBasedProposalReviewerThreads = await getPageThreads({
      pageId: proposalPageId,
      userId: idBasedProposalReviewer.id
    });

    const nonProposalReviewerThreads = await getPageThreads({
      pageId: proposalPageId,
      userId: nonProposalReviewer.id
    });

    expect(roleBasedProposalReviewerThreads.map((pageThread) => pageThread.id)).toStrictEqual([
      proposalReviewersVisibleThread.id
    ]);
    expect(idBasedProposalReviewerThreads.map((pageThread) => pageThread.id)).toStrictEqual([
      proposalReviewersVisibleThread.id
    ]);
    expect(nonProposalReviewerThreads.map((pageThread) => pageThread.id)).toStrictEqual([]);
  });

  it(`Should get page threads based on proposal authors access`, async () => {
    const { user: adminUser, space } = await generateUserAndSpace({
      isAdmin: true
    });

    const proposalAuthor = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: proposalAuthor.id
    });

    const nonProposalAuthor = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: nonProposalAuthor.id
    });

    const category = await createProposalCategory({
      data: {
        spaceId: space.id,
        title: 'Proposal category'
      }
    });

    const proposal = await createProposal({
      categoryId: category.id,
      spaceId: space.id,
      userId: adminUser.id,
      authors: [proposalAuthor.id]
    });

    const proposalPageId = proposal.page.id;

    const proposalAuthorsVisibleThread = await createThread({
      accessGroup: {
        group: 'authors',
        id: null
      },
      comment: 'Comment',
      context: 'Context',
      pageId: proposalPageId,
      userId: adminUser.id
    });

    const proposalAuthorThreads = await getPageThreads({
      pageId: proposalPageId,
      userId: proposalAuthor.id
    });

    const nonProposalAuthorThreads = await getPageThreads({
      pageId: proposalPageId,
      userId: nonProposalAuthor.id
    });

    expect(proposalAuthorThreads.map((pageThread) => pageThread.id)).toStrictEqual([proposalAuthorsVisibleThread.id]);
    expect(nonProposalAuthorThreads.map((pageThread) => pageThread.id)).toStrictEqual([]);
  });
});
