import { DataNotFoundError } from './errors';

export class PageNotFoundError extends DataNotFoundError {
  constructor(pageId: string) {
    super(`Page with id ${pageId} not found`);
  }
}
