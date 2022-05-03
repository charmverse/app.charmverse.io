import { StringLiteralLike } from 'typescript';

/**
 * @id the actual snapshot domain
 */
export interface SnapshotSpace {
  about: string;
  admins: string[];
  avatar: string;
  categories: string[];
  id: string;
  filters: {
    minScore: number;
    onlyMembers: boolean;
  };
  members: string[];
  name: string;
  network: string;
  private: boolean;
  strategies: any[]
  // TBC - Check out validation
  // validation:
}

export type SnapshotProposalState = 'pending' | 'active' | 'closed'

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string [];
  start: number;
  end: number;
  snapshot: string;
  state: SnapshotProposalState;
  author: string;
  space: Pick<SnapshotSpace, 'id' | 'name'>
}

export interface SnapshotReceipt {
  id: string;
  ipfs: string;
  relayer: {
    address: string;
    receipt: string
  }
}
