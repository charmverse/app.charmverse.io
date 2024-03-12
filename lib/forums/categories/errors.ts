import { SystemError } from 'lib/utils/errors';

export class PostCategoryNotDeleteableError extends SystemError {
  constructor() {
    super({
      message: 'This category cannot be deleted because it contains posts',
      errorType: 'Undesirable operation',
      severity: 'warning'
    });
  }
}

export class PostCategoryNotFoundError extends SystemError {
  constructor(categoryId: string) {
    super({
      message: `Post category with ID ${categoryId} not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}
