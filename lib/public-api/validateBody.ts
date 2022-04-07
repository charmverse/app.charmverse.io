import { PageQuery, PaginatedQuery, Page } from './interfaces';
import { UnsupportedKeysError } from './errors';

/**
 * Use this in the api to throw an error when an unsupported field is provided
 * Only inspects the top level fields to ensure
 * @returns true if this is valid
 * @throws An error indicating the invalid fields
 */
export function validatePageQuery (query: PageQuery): true {
  // Empty queries are allowed
  if (query === undefined || query === null) {
    return true;
  }

  const supportedKeys: Array<keyof PageQuery> = ['properties', 'title'];

  const queryKeys = Object.keys(query);

  const unsupportedKeys: string [] = [];

  for (const key of queryKeys) {
    if (supportedKeys.some(supported => supported === key) === false) {
      unsupportedKeys.push(key);
    }
  }

  if (unsupportedKeys.length > 0) {
    throw <UnsupportedKeysError>{
      error: 'Your query content for pages contains unsupported keys',
      unsupportedKeys,
      allowedKeys: supportedKeys,
      example: {
        query: {
          title: 'my page',
          properties: {
            customProperty: 'value'
          }
        }
      }
    };
  }

  return true;

}

/**
 * Use this in the api to throw an error when an unsupported field is provided
 * For now, we use the same fields to update, create and query a page
 * This wrapper exists so we can seaparate this behaviour in future if needed
 * @returns true if this is valid
 * @throws An error indicating the invalid fields
 */
export function validateCreationData (creationData: PageQuery): true {
  try {
    validatePageQuery(creationData);
    return true;
  }
  catch (error) {
    const modifiedError: UnsupportedKeysError<Pick<Page, 'title' | 'properties'>> = { ...(error as any) };

    modifiedError.error = 'Invalid data inside your creation data';
    modifiedError.example = {
      title: 'Page title',
      properties: {
        customProperty: 'initial value'
      }
    };

    throw modifiedError;
  }

}

/**
 * Use this in the api to throw an error when an unsupported field is provided
 * For now, we use the same fields to update, create and query a page
 * This wrapper exists so we can seaparate this behaviour in future if needed
 * @returns true if this is valid
 * @throws An error indicating the invalid fields
 */
export function validateUpdateData (creationData: PageQuery): true {
  try {
    validatePageQuery(creationData);
    return true;
  }
  catch (error) {
    const modifiedError: UnsupportedKeysError<Pick<Page, 'title' | 'properties'>> = { ...(error as any) };

    modifiedError.error = 'Invalid data inside your update data';
    modifiedError.example = {
      title: 'New page title',
      properties: {
        customProperty: 'new value'
      }
    };

    throw modifiedError;
  }
}

export function validatePaginationQuery (query: PaginatedQuery<PageQuery>): true {
  // Empty queries are allowed
  if (query === undefined || query === null) {
    return true;
  }

  const supportedKeys: Array<keyof PaginatedQuery<PageQuery>> = ['cursor', 'limit', 'query'];

  const queryKeys = Object.keys(query);

  const unsupportedKeys: string [] = [];

  for (const key of queryKeys) {
    if (supportedKeys.some(supported => supported === key) === false) {
      unsupportedKeys.push(key);
    }
  }

  if (unsupportedKeys.length > 0) {
    throw {
      error: 'Your query contains unsupported keys',
      unsupportedKeys,
      allowedKeys: supportedKeys,
      example: {
        limit: 1,
        cursor: 'e63758e2-de17-48b2-9c74-5a40ea5be761',
        query: {
          title: 'my page'
        }
      }
    };
  }

  return true;
}
