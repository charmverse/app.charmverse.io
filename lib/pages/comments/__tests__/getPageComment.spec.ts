import { v4 } from 'uuid';

import { PageCommentNotFoundError } from 'lib/pages/comments/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePageWithComment } from 'testing/utils/pages';

import { getPageComment } from '../getPageComment';

describe('getPageComment', () => {
  it('should return a page comment', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const { comment } = await generatePageWithComment(
      {
        spaceId: space.id,
        userId: user.id
      },
      {
        content: {
          type: ''
        },
        contentText: 'comment'
      }
    );

    const retrievedComment = await getPageComment(comment.id);

    expect(retrievedComment).toEqual(comment);
  });

  it('should throw an error if the comment does not exist', async () => {
    await expect(getPageComment(v4())).rejects.toBeInstanceOf(PageCommentNotFoundError);
  });
});
