import { SystemError, ISystemErrorInput } from 'lib/utilities/errors';

export class FormError extends SystemError {

  // eslint-disable-next-line no-useless-constructor
  constructor (errorInfo: ISystemErrorInput) {
    super(errorInfo);
  }

}
