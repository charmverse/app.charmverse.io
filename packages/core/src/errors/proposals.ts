import { DataNotFoundError } from './errors';

export class ProposalNotFoundError extends DataNotFoundError {
  constructor(proposalid: string) {
    super(`Proposal with ID ${proposalid} not found`);
  }
}
