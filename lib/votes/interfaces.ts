import type { Space, User, UserVote, Vote, VoteOptions } from '@prisma/client';

import type { NotificationActor } from 'lib/notifications/mapNotificationActor';
import type { PageMeta } from 'lib/pages';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;
export type VoteStatusType = (typeof VOTE_STATUS)[number];

export interface VoteOptionsDTO {
  name: string;
  threshold?: number;
}

export interface VoteDTO extends Omit<Vote, 'id' | 'status' | 'createdAt'> {
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
  page: PageMeta;
  space: Space;
  createdBy: NotificationActor | null;
  taskId: string;
};

export type UserVoteExtendedDTO = UserVote & {
  user: Pick<User, 'avatar' | 'username' | 'id'>;
};

export interface SpaceVotesRequest {
  userId: string;
  spaceId: string;
}
