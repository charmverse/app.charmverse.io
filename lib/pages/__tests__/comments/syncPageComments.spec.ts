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
  lensClient: {
    publication: {
      fetchAll: jest.fn()
    }
  }
}));

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
      profile: lensUser1,
      metadata: {
        content: 'Lens Comment 1'
      }
    };

    const lensComment2 = {
      id: v4(),
      profile: lensUser2,
      metadata: {
        content: 'Lens Comment 2'
      }
    };

    const lensComment3 = {
      id: v4(),
      profile: lensUser2,
      metadata: {
        content: 'Lens Comment 3'
      }
    };

    const lensComment1NestedComment1 = {
      id: v4(),
      profile: lensUser1,
      metadata: {
        content: 'Lens Comment 1 Nested Comment 1'
      }
    };
    const lensComment1NestedComment2 = {
      id: v4(),
      profile: lensUser2,
      metadata: {
        content: 'Lens Comment 1 Nested Comment 2'
      }
    };
    const lensComment1NestedComment3 = {
      id: v4(),
      profile: lensUser2,
      metadata: {
        content: 'Lens Comment 1 Nested Comment 3'
      }
    };
    const lensComment2NestedComment1 = {
      id: v4(),
      profile: lensUser1,
      metadata: {
        content: 'Lens Comment 2 Nested Comment 1'
      }
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
      }))
      .mockImplementation(() => ({
        items: [],
        pageInfo: {
          next: null
        }
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

    // This comment already exist in charmverse so we should not create it again
    const pageComment1 = await createPageComment({
      content: {
        type: 'doc',
        content: [
          {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Regular Comment 1'
                  }
                ]
              }
            ]
          }
        ]
      },
      contentText: 'Regular Comment 1',
      pageId: proposalPage.page.id,
      userId: user.id
    });

    await updatePageComment({
      commentId: pageComment1.id,
      lensCommentLink: lensComment1.id
    });

    // This is a regular comment on proposal page, it should be left untouched
    await createPageComment({
      content: {
        type: 'doc',
        content: [
          {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Regular Comment 2'
                  }
                ]
              }
            ]
          }
        ]
      },
      contentText: 'Regular Comment 2',
      pageId: proposalPage.page.id,
      userId: user.id
    });

    const pageComments = await syncPageComments({
      lensPostLink: lensPostId,
      pageId: proposalPage.page.id,
      spaceId: space.id,
      userId: user.id
    });

    const lensCommentCount = pageComments.filter((pageComment) => pageComment.lensCommentLink).length;
    const nonLensCommentCount = pageComments.filter((pageComment) => !pageComment.lensCommentLink).length;
    expect(lensCommentCount).toBe(7);
    expect(nonLensCommentCount).toBe(1);
  });
});
