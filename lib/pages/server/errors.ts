import { SystemError } from 'lib/utils/errors';

export class PageNotFoundError extends SystemError {
  constructor(pageId: string) {
    super({
      message: `Page with id '${pageId}' was not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}
