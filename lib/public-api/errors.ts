import { ISystemErrorInput, SystemError } from 'lib/utilities/errors';

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

export interface UnsupportedKeyDetails<E = any> {
  unsupportedKeys: string [],
  allowedKeys: string [],
  example: E
}

export class UnsupportedKeysError<D = any> extends SystemError<UnsupportedKeyDetails> {

  constructor (errorInfo: Pick<ISystemErrorInput<UnsupportedKeyDetails<D>>, 'error' | 'message'>) {
    super({
      errorType: 'Invalid input',
      message: errorInfo.message,
      error: errorInfo.error,
      severity: 'warning'
    });
  }
}
