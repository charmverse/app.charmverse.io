import type { UnsupportedKeyDetails } from './errors';
import { UnsupportedKeysError } from './errors';
import type { CardPageQuery, PaginatedQuery, CardPage } from './interfaces';

/**
 * Use this in the api to throw an error when an unsupported field is provided
 * Only inspects the top level fields to ensure
 * @returns true if this is valid
 * @throws An error indicating the invalid fields
 */
export function validatePageQuery(query: CardPageQuery): true {
  // Empty queries are allowed
  if (query === undefined || query === null) {
    return true;
  }

  const supportedKeys: (keyof CardPageQuery)[] = ['properties', 'title'];

  const queryKeys = Object.keys(query);

  const unsupportedKeys: string[] = [];

  for (const key of queryKeys) {
    if (supportedKeys.some((supported) => supported === key) === false) {
      unsupportedKeys.push(key);
    }
  }

  if (unsupportedKeys.length > 0) {
    const errorDetails: UnsupportedKeyDetails = {
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

    throw new UnsupportedKeysError({
      message: 'Your query content for pages contains unsupported keys',
      error: errorDetails
    });
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
export function validateCreationData(creationData: CardPageQuery): true {
  try {
    validatePageQuery(creationData);
    return true;
  } catch (error) {
    const modifiedError = error as UnsupportedKeysError<Pick<CardPage, 'title' | 'properties'>>;

    modifiedError.error.example = {
      title: 'Page title',
      properties: {
        customProperty: 'initial value'
      }
    };

    modifiedError.message = 'Invalid data inside your creation data';

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
export function validateUpdateData(creationData: CardPageQuery): true {
  try {
    validatePageQuery(creationData);
    return true;
  } catch (error) {
    const modifiedError = error as UnsupportedKeysError;

    modifiedError.error.example = {
      title: 'New page title',
      properties: {
        customProperty: 'new value'
      }
    };

    modifiedError.message = 'Invalid data inside your update data';

    throw modifiedError;
  }
}

export function validatePaginationQuery(query: PaginatedQuery<CardPageQuery>): true {
  // Empty queries are allowed
  if (query === undefined || query === null) {
    return true;
  }

  const supportedKeys: (keyof PaginatedQuery<CardPageQuery>)[] = ['cursor', 'limit', 'query'];

  const queryKeys = Object.keys(query);

  const unsupportedKeys: string[] = [];

  for (const key of queryKeys) {
    if (supportedKeys.some((supported) => supported === key) === false) {
      unsupportedKeys.push(key);
    }
  }

  if (unsupportedKeys.length > 0) {
    throw new UnsupportedKeysError({
      message: 'Your query contains unsupported keys',
      error: {
        unsupportedKeys,
        allowedKeys: supportedKeys,
        example: {
          limit: 1,
          cursor: 'e63758e2-de17-48b2-9c74-5a40ea5be761',
          query: {
            title: 'my page'
          }
        }
      }
    });
  }

  return true;
}
