import type { UnsupportedKeyDetails } from './errors';
import { UnsupportedKeysError } from './errors';
import type { CardPageCreationData, CardPageQuery, CardPageUpdateData, PaginatedQuery } from './interfaces';

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
 * @returns true if this is valid
 * @throws An error indicating the invalid fields
 */
export function validateCreationData(creationData: CardPageCreationData): true {
  if (creationData === undefined || creationData === null) {
    return true;
  }

  const supportedKeys: (keyof CardPageCreationData)[] = ['title', 'properties', 'contentMarkdown'];

  const creationDataKeys = Object.keys(creationData);

  const unsupportedKeys: string[] = [];

  for (const key of creationDataKeys) {
    if (!supportedKeys.includes(key as any)) {
      unsupportedKeys.push(key);
    }
  }

  if (unsupportedKeys.length > 0) {
    const errorDetails: UnsupportedKeyDetails = {
      unsupportedKeys,
      allowedKeys: supportedKeys,
      example: {
        body: {
          title: 'my page',
          properties: {
            customProperty: 'value'
          },
          contentMarkdown: '### Markdown title'
        }
      }
    };

    throw new UnsupportedKeysError({
      message: 'Your creation data for this card contains unsupported keys',
      error: errorDetails
    });
  }

  return true;
}

/**
 * Use this in the api to throw an error when an unsupported field is provided
 * @returns true if this is valid
 * @throws An error indicating the invalid fields
 */
export function validateUpdateData(updateData: CardPageUpdateData): true {
  if (updateData === undefined || updateData === null) {
    return true;
  }

  const supportedKeys: (keyof CardPageCreationData)[] = ['title', 'properties'];

  const creationDataKeys = Object.keys(updateData);

  const unsupportedKeys: string[] = [];

  for (const key of creationDataKeys) {
    if (!supportedKeys.includes(key as any)) {
      unsupportedKeys.push(key);
    }
  }

  if (unsupportedKeys.length > 0) {
    const errorDetails: UnsupportedKeyDetails = {
      unsupportedKeys,
      allowedKeys: supportedKeys,
      example: {
        body: {
          title: 'my page',
          properties: {
            customProperty: 'value'
          }
        }
      }
    };

    throw new UnsupportedKeysError({
      message: 'Your update data for this card contains unsupported keys',
      error: errorDetails
    });
  }

  return true;
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
