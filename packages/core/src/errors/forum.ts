import { SystemError } from './errors';

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

export class PostNotFoundError extends SystemError {
  constructor(postId: string) {
    super({
      message: `Post with id ${postId} not found`,
      severity: 'warning',
      errorType: 'Data not found'
    });
  }
}
