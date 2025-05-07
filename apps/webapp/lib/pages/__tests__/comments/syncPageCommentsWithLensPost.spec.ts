import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { lensClient } from '@packages/lib/lens/lensClient';
import { createPageComment } from '@packages/pages/comments/createPageComment';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateSpaceRole } from '__e2e__/utils/mocks';
import { v4 } from 'uuid';

import { syncPageCommentsWithLensPost } from 'lib/pages/comments/syncPageCommentsWithLensPost';
import { updatePageComment } from 'lib/pages/comments/updatePageComment';

jest.mock('lib/lens/lensClient', () => ({
  lensClient: {
    publication: {
      fetchAll: jest.fn()
    }
  }
}));

describe('syncPageCommentsWithLensPost', () => {
  it(`Should sync lens post comment to CharmVerse`, async () => {
    const lensUser1 = {
      handle: {
        fullHandle: v4().split(' ')[0]
      },
      coverPicture: {
        __typename: 'MediaSet',
        original: {
          url: 'https://example.com/123.png'
        }
      }
    };

    const lensUser2 = {
      handle: {
        fullHandle: v4().split(' ')[0]
      },
      convertPicture: {
        __typename: 'NftImage',
        uri: 'ipfs://123'
      }
    };

    const lensComment1 = {
      id: v4(),
      profile: lensUser1,
      by: lensUser1,
      metadata: {
        content: 'Lens Comment 1'
      }
    };

    const lensComment2 = {
      id: v4(),
      profile: lensUser2,
      by: lensUser2,
      metadata: {
        content: 'Lens Comment 2'
      }
    };

    const lensComment3 = {
      id: v4(),
      profile: lensUser2,
      by: lensUser2,
      metadata: {
        content: 'Lens Comment 3'
      }
    };

    const lensComment4 = {
      id: v4(),
      profile: lensUser1,
      by: lensUser1,
      metadata: {
        content: 'Lens Comment 4'
      }
    };

    const lensComment1NestedComment1 = {
      id: v4(),
      profile: lensUser1,
      by: lensUser1,
      metadata: {
        content: 'Lens Comment 1 Nested Comment 1'
      }
    };

    const lensComment1NestedComment2 = {
      id: v4(),
      profile: lensUser2,
      by: lensUser2,
      metadata: {
        content: 'Lens Comment 1 Nested Comment 2'
      }
    };

    const lensComment1NestedComment3 = {
      id: v4(),
      profile: lensUser2,
      by: lensUser2,
      metadata: {
        content: 'Lens Comment 1 Nested Comment 3'
      }
    };

    const lensComment2NestedComment1 = {
      id: v4(),
      profile: lensUser1,
      by: lensUser1,
      metadata: {
        content: 'Lens Comment 2 Nested Comment 1'
      }
    };

    const lensPost1Id = v4();
    const lensPost2Id = v4();

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

    const { space: space1, user } = await generateUserAndSpace();
    const { space: space2 } = await generateUserAndSpace();
    await generateSpaceRole({
      spaceId: space2.id,
      userId: user.id
    });

    const space1ProposalPage = await testUtilsProposals.generateProposal({
      spaceId: space1.id,
      userId: user.id
    });

    await prisma.page.update({
      where: {
        id: space1ProposalPage.page.id
      },
      data: {
        lensPostLink: lensPost1Id
      }
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
      pageId: space1ProposalPage.page.id,
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
      pageId: space1ProposalPage.page.id,
      userId: user.id
    });

    const space2ProposalPage = await testUtilsProposals.generateProposal({
      spaceId: space2.id,
      userId: user.id
    });

    await prisma.page.update({
      where: {
        id: space2ProposalPage.page.id
      },
      data: {
        lensPostLink: lensPost2Id
      }
    });

    const pageComments = await syncPageCommentsWithLensPost({
      lensPostLink: lensPost1Id,
      pageId: space1ProposalPage.page.id,
      spaceId: space1.id,
      userId: user.id
    });

    // Create a separate implementation for fetchAll for space 2 proposal

    lensClient.publication.fetchAll = jest
      .fn()
      .mockImplementationOnce(() => ({
        pageInfo: {
          next: null
        },
        items: [lensComment4]
      }))
      .mockImplementation(() => ({
        items: [],
        pageInfo: {
          next: null
        }
      }));

    // Sync page comments for space 2 proposal
    await syncPageCommentsWithLensPost({
      lensPostLink: lensPost2Id,
      pageId: space2ProposalPage.page.id,
      spaceId: space2.id,
      userId: user.id
    });

    const lensCommentCount = pageComments.filter((pageComment) => pageComment.lensCommentLink).length;
    const nonLensCommentCount = pageComments.filter((pageComment) => !pageComment.lensCommentLink).length;

    const charmverseLensUser1 = await prisma.user.findFirstOrThrow({
      where: {
        username: `${lensUser1.handle.fullHandle.toLowerCase()}-lens-imported`
      }
    });

    const charmverseLensUser2 = await prisma.user.findFirstOrThrow({
      where: {
        username: `${lensUser2.handle.fullHandle.toLowerCase()}-lens-imported`
      }
    });

    const charmverseLensUser1Space1Role = await prisma.spaceRole.findFirst({
      where: {
        userId: charmverseLensUser1.id,
        spaceId: space1.id
      }
    });

    const charmverseLensUser1Space2Role = await prisma.spaceRole.findFirst({
      where: {
        userId: charmverseLensUser1.id,
        spaceId: space2.id
      }
    });

    const charmverseLensUser2Space1Role = await prisma.spaceRole.findFirst({
      where: {
        userId: charmverseLensUser2.id,
        spaceId: space1.id
      }
    });

    expect(lensCommentCount).toBe(7);
    expect(nonLensCommentCount).toBe(1);
    expect(charmverseLensUser1).toBeTruthy();
    expect(charmverseLensUser2).toBeTruthy();
    expect(charmverseLensUser1Space1Role).toBeTruthy();
    expect(charmverseLensUser1Space2Role).toBeTruthy();
    expect(charmverseLensUser2Space1Role).toBeTruthy();
  });
});
