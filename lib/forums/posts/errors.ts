import { SystemError } from 'lib/utilities/errors';

export class PostNotFoundError extends SystemError {
  constructor(postId: string) {
    super({
      message: `Post with id ${postId} not found`,
      severity: 'warning',
      errorType: 'Data not found'
    });
  }
}
