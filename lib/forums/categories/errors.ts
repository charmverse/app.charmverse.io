import { SystemError } from 'lib/utilities/errors';

export class PostCategoryNotDeleteableError extends SystemError {
  constructor() {
    super({
      message: 'This category cannot be deleted because it contains posts',
      errorType: 'Undesirable operation',
      severity: 'warning'
    });
  }
}
