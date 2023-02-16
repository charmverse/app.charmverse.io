import { SystemError } from 'lib/utilities/errors';

export class ProposalCategoryNotDeleteableError extends SystemError {
  constructor() {
    super({
      message: 'This category cannot be deleted because it contains proposals',
      errorType: 'Undesirable operation',
      severity: 'warning'
    });
  }
}

export class ProposalCategoryNotFoundError extends SystemError {
  constructor(categoryId: string) {
    super({
      message: `Proposal category with ID ${categoryId} not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}
