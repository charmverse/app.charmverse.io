import type { ISystemErrorInput } from '@packages/utils/errors';
import { SystemError } from '@packages/utils/errors';

import type { PageProperty } from './interfaces';

export class PageNotFoundError extends SystemError {
  constructor(pageId: string) {
    super({
      message: `Page with id '${pageId}' was not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

export class DatabasePageNotFoundError extends SystemError {
  constructor(pageId: string) {
    super({
      message: `Database page with id '${pageId}' was not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

export interface UnsupportedKeyDetails<E = any> {
  unsupportedKeys: string[];
  allowedKeys: string[];
  example: E;
}

export class UnsupportedKeysError<D = any> extends SystemError<UnsupportedKeyDetails> {
  constructor(errorInfo: Pick<ISystemErrorInput<UnsupportedKeyDetails<D>>, 'error' | 'message'>) {
    super({
      errorType: 'Invalid input',
      message: errorInfo.message,
      error: errorInfo.error,
      severity: 'warning'
    });
  }
}

export class SpaceNotFoundError extends SystemError {
  constructor(id: string) {
    super({
      message: `Space with id '${id}' was not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

/**
 * Specify one or multiple invalid keys that were attempted when assigning custom properties
 */
export class InvalidCustomPropertyKeyError extends SystemError<UnsupportedKeyDetails> {
  constructor(errorInfo: { key: string | string[]; boardSchema: PageProperty[] }) {
    const allowedKeys = errorInfo.boardSchema.reduce((keys: string[], schema) => {
      keys.push(schema.name);
      return keys;
    }, []);

    const example = errorInfo.boardSchema.reduce((exampleObj: Record<string, any>, schema) => {
      exampleObj[schema.name] = 'value';

      if (schema.type === 'multiSelect' || schema.type === 'select') {
        exampleObj[schema.name] = schema.options?.[0].value;
      }

      return exampleObj;
    }, {});

    const errorDetails: UnsupportedKeyDetails = {
      allowedKeys,
      unsupportedKeys: errorInfo.key instanceof Array ? errorInfo.key : [errorInfo.key],
      example
    };

    const invalidKeyMessage =
      errorInfo.key instanceof Array
        ? `Key(s) '${errorInfo.key.join(', ')}' are invalid custom properties.`
        : `Key '${errorInfo.key} is an invalid custom property'`;

    super({
      message: invalidKeyMessage,
      errorType: 'Invalid input',
      severity: 'warning',
      error: errorDetails
    });
  }
}

/**
 * Used when an option does not exist in a list
 */
export class InvalidCustomPropertyValueError extends SystemError<{ validOptions: any[] }> {
  constructor(errorInfo: { key: string; value: any; boardSchema: PageProperty[] }) {
    const allowedValues =
      errorInfo.boardSchema.find((schema) => schema.name === errorInfo.key)?.options?.map((opt) => opt.value) ?? [];

    super({
      message: `Value '${errorInfo.value}' is an invalid option for property ${errorInfo.key}`,
      errorType: 'Invalid input',
      severity: 'warning',
      error: {
        validOptions: allowedValues
      }
    });
  }
}
