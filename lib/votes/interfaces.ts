import type { Space, User, UserVote, Vote, VoteOptions } from '@prisma/client';

import type { PageMeta } from 'lib/pages';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;
export type VoteStatusType = typeof VOTE_STATUS[number];

export interface VoteOptionsDTO {
  name: string;
  threshold?: number;
}

export interface VoteDTO extends Omit<Vote, 'id' | 'status' | 'createdAt'> {
  voteOptions: string[];
}

export interface UpdateVoteDTO {
  status: VoteStatusType;
}

export interface UserVoteDTO {
  choice: string;
}
export interface ExtendedVote extends Vote {
  aggregatedResult: Record<string, number>;
  voteOptions: VoteOptions[];
  userChoice: null | string;
  totalVotes: number;
}

export type VoteTask = ExtendedVote & {
  page: PageMeta;
  space: Space;
};

export type UserVoteExtendedDTO = UserVote & {
  user: Pick<User, 'avatar' | 'username'>;
};

export interface SpaceVotesRequest {
  userId: string;
  spaceId: string;
}
