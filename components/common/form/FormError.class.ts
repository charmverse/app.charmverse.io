import type { ISystemErrorInput } from 'lib/utils/errors';
import { SystemError } from 'lib/utils/errors';

export class FormError extends SystemError {
  // eslint-disable-next-line no-useless-constructor
  constructor(errorInfo: ISystemErrorInput) {
    super(errorInfo);
  }
}
