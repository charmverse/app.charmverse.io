import { SystemError } from 'lib/utilities/errors';

export class PostCommentNotFoundError extends SystemError {
  constructor(postCommentId: string) {
    super({
      message: `Post comment with id ${postCommentId} not found`,
      severity: 'warning',
      errorType: 'Data not found'
    });
  }
}
