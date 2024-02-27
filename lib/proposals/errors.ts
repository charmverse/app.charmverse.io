import { SystemError } from 'lib/utils/errors';

export class ProposalNotFoundError extends SystemError {
  constructor(proposalid: string) {
    super({
      message: `Proposal with ID ${proposalid} not found`,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}
