import { v4 } from 'uuid';

import { lensClient } from 'lib/lens/lensClient';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import { syncPageComments } from 'lib/pages/comments/syncPageComments';
import { updatePageComment } from 'lib/pages/comments/updatePageComment';
import { createProposal } from 'lib/proposal/createProposal';
import { createProposalCategory } from 'lib/proposal/createProposalCategory';
import { updateProposalLensProperties } from 'lib/proposal/updateProposalLensProperties';
import { generateUserAndSpace } from 'testing/setupDatabase';

jest.mock('lib/lens/lensClient', () => ({
  publication: {
    fetchAll: jest.fn()
  }
}));

function sortLensComments(c1lensCommentLink: string | null, c2lensCommentLink: string | null) {
  return (c1lensCommentLink ?? '') > (c2lensCommentLink ?? '') ? 1 : -1;
}

describe('syncPageComments', () => {
  it(`Should sync lens post comment to CharmVerse`, async () => {
    const lensUser1 = {
      handle: v4().split(' ')[0],
      coverPicture: {
        __typename: 'MediaSet',
        original: {
          url: 'https://example.com/123.png'
        }
      }
    };

    const lensUser2 = {
      handle: v4().split(' ')[0],
      convertPicture: {
        __typename: 'NftImage',
        uri: 'ipfs://123'
      }
    };

    const lensComment1 = {
      id: v4(),
      profile: lensUser1
    };

    const lensComment2 = {
      id: v4(),
      profile: lensUser2
    };

    const lensComment3 = {
      id: v4(),
      profile: lensUser2
    };

    const lensComment1NestedComment1 = {
      id: v4(),
      profile: lensUser1
    };
    const lensComment1NestedComment2 = {
      id: v4(),
      profile: lensUser2
    };
    const lensComment1NestedComment3 = {
      id: v4(),
      profile: lensUser2
    };
    const lensComment2NestedComment1 = {
      id: v4(),
      profile: lensUser1
    };

    const lensPostId = v4();

    const publicationFetchAll = jest
      .fn()
      .mockImplementationOnce(() => ({
        pageInfo: {
          // cursor for next comment
          next: lensComment3.id
        },
        items: [lensComment1, lensComment2]
      }))
      .mockImplementationOnce(() => ({
        pageInfo: {
          cursor: null
        },
        items: [lensComment3]
      }))
      .mockImplementationOnce(() => ({
        pageInfo: {
          next: lensComment1NestedComment3.id
        },
        items: [lensComment1NestedComment1, lensComment1NestedComment2]
      }))
      .mockImplementationOnce(() => ({
        pageInfo: {
          next: null
        },
        items: [lensComment1NestedComment3]
      }))
      .mockImplementationOnce(() => ({
        pageInfo: {
          next: null
        },
        items: [lensComment2NestedComment1]
      }));

    lensClient.publication.fetchAll = publicationFetchAll;

    const { space, user } = await generateUserAndSpace();

    const proposalCategory = await createProposalCategory({
      data: {
        spaceId: space.id,
        title: 'Test Category'
      }
    });

    const proposalPage = await createProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id
    });

    await updateProposalLensProperties({
      proposalId: proposalPage.proposal.id,
      lensPostLink: lensPostId
    });

    const pageComments = await syncPageComments({
      lensPostLink: lensPostId,
      pageId: proposalPage.page.id,
      spaceId: space.id,
      userId: user.id
    });

    // This comment already exist in charmverse so we should not create it again
    const pageComment1 = await createPageComment({
      content: {
        type: 'doc',
        content: []
      },
      contentText: 'Hello World',
      pageId: proposalPage.page.id,
      userId: user.id
    });

    await updatePageComment({
      commentId: pageComment1.id,
      lensCommentLink: lensComment1.id
    });

    // This is a regular comment on proposal page, it should be left untouched
    const pageComment2 = await createPageComment({
      content: {
        type: 'doc',
        content: []
      },
      contentText: 'Hello World',
      pageId: proposalPage.page.id,
      userId: user.id
    });

    expect(pageComments.map((pageComment) => pageComment.lensCommentLink).sort(sortLensComments)).toStrictEqual(
      [
        pageComment2.id,
        lensComment1.id,
        lensComment2.id,
        lensComment1NestedComment1.id,
        lensComment1NestedComment2.id,
        lensComment1NestedComment3.id,
        lensComment2NestedComment1.id
      ].sort(sortLensComments)
    );
  });
});
