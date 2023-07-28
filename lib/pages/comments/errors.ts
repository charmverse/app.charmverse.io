import { SystemError } from 'lib/utilities/errors';

export class PageCommentNotFoundError extends SystemError {
  constructor(commentId: string) {
    super({
      message: `Page comment with id ${commentId} not found`,
      severity: 'warning',
      errorType: 'Data not found'
    });
  }
}
