export interface SnapshotVotingStrategy {
  name: string;
  network: string;
  params: any;
}

// Comes from snapshot.js https://github.com/snapshot-labs/snapshot/blob/fd1f2ba15543583861df750b0958d1794cc625bb/src/components/Modal/VotingType.vue
export const SnapshotVotingMode = {
  'single-choice': 'Single choice',
  approval: 'Approval',
  'ranked-choice': 'Ranked choice',
  quadratic: 'Quadratic',
  weighted: 'Weighted',
  custom: 'Custom',
  basic: 'Basic'
};

export type SnapshotVotingModeType = keyof typeof SnapshotVotingMode;

/**
 * @id the actual snapshot domain
 */
export interface SnapshotSpace {
  about: string;
  // All 3 categories are required
  admins: string[];
  members: string[];
  moderators: string[];
  avatar: string;
  categories: string[];
  id: string;
  filters: {
    minScore: number;
    onlyMembers: boolean;
  };
  name: string;
  network: string;
  private: boolean;
  strategies: SnapshotVotingStrategy[];
  voting: {
    // Number of seconds proposals are active for
    period: number | null;
    delay: number | null;
    type: SnapshotVotingModeType | null;
  };
}

export type SnapshotProposalState = 'pending' | 'active' | 'closed';

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: string;
  state: SnapshotProposalState;
  author: string;
  space: Pick<SnapshotSpace, 'id' | 'name'>;
  votes: number;
  // List of numbers in same order as the scores
  scores: number[];
  scores_total: number;
}

export interface SnapshotReceipt {
  id: string;
  ipfs: string;
  relayer: {
    address: string;
    receipt: string;
  };
}
