import type { User, UserVote, Vote, VoteOptions } from '@prisma/client';

import type { NotificationActor } from 'lib/notifications/mapNotificationActor';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;

export interface VoteDTO extends Omit<Vote, 'id' | 'status' | 'createdAt' | 'postId' | 'pageId'> {
  pageId?: string | null;
  postId?: string | null;
  voteOptions: string[];
}

export type UpdateVoteDTO = Pick<Vote, 'status' | 'deadline'>;

export interface UserVoteDTO {
  choice: string;
}
export interface ExtendedVote extends Vote {
  aggregatedResult: Record<string, number>;
  voteOptions: VoteOptions[];
  userChoice: null | string;
  totalVotes: number;
}

export type VoteTask = Omit<ExtendedVote, 'createdBy'> & {
  // page?: PageMeta;
  // space: Space;
  createdBy: NotificationActor | null;
  taskId: string;
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
