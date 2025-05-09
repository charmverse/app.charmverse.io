import { SystemError } from '@packages/utils/errors';

export class PageCommentNotFoundError extends SystemError {
  constructor(commentId: string) {
    super({
      message: `Page comment with id ${commentId} not found`,
      severity: 'warning',
      errorType: 'Data not found'
    });
  }
}
