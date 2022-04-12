import { SystemError } from 'lib/utilities/errors';

export class PageNotFoundError extends SystemError {

  constructor (pageId: string) {
    super({
      message: `Page with id '${pageId}' was not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

export class DatabasePageNotFoundError extends SystemError {

  constructor (pageId: string) {
    super({
      message: `Database page with id '${pageId}' was not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

export interface UnsupportedKeysError<E = any> {
  error: string
  unsupportedKeys: string [],
  allowedKeys: string [],
  example: E
}
