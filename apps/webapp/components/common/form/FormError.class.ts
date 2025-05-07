import type { ISystemErrorInput } from '@packages/utils/errors';
import { SystemError } from '@packages/utils/errors';

export class FormError extends SystemError {
  // eslint-disable-next-line no-useless-constructor
  constructor(errorInfo: ISystemErrorInput) {
    super(errorInfo);
  }
}
