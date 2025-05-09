import type { User, UserVote, Vote, VoteOptions } from '@charmverse/core/prisma';
import type { NotificationActor } from '@packages/lib/notifications/interfaces';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;

export interface VoteDTO
  extends Omit<
    Vote,
    'id' | 'status' | 'createdAt' | 'postId' | 'pageId' | 'description' | 'blockNumber' | 'chainId' | 'tokenAddress'
  > {
  pageId?: string | null;
  postId?: string | null;
  voteOptions: string[];
  spaceId: string;
  evaluationId?: string;
  blockNumber?: string;
  tokenAddress?: string;
  chainId?: number;
}

export type UpdateVoteDTO = Pick<Vote, 'status' | 'deadline'>;

export interface UserVoteDTO {
  choices: string[];
}
export interface ExtendedVote extends Vote {
  aggregatedResult: Record<string, number>;
  voteOptions: VoteOptions[];
  userChoice: null | string[];
  totalVotes: number;
  votingPower: number;
  totalVotingPower?: number;
}

export type VoteTask = Omit<ExtendedVote, 'createdBy'> & {
  // page?: PageMeta;
  // space: Space;
  createdBy: NotificationActor;
  id: string;
  spaceName: string;
  spaceDomain: string;
  pagePath: string;
  pageTitle: string;
};

export type UserVoteExtendedDTO = UserVote & {
  user: Pick<User, 'avatar' | 'username' | 'id'>;
};

export interface SpaceVotesRequest {
  userId: string;
  spaceId: string;
}
