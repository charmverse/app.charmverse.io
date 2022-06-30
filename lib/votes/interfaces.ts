import { Vote, VoteOptions, UserVote } from '@prisma/client';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;
export type VoteStatusType = typeof VOTE_STATUS[number];

export interface VoteOptionsDTO {
    name: string,
    threshold?: number
}

export interface VoteDTO extends Omit<Vote, 'id'|'status'|'createdAt'> {
    voteOptions: VoteOptionsDTO[]
}

export interface UpdateVoteDTO {
    status: VoteStatusType
}

export interface ExtendedVote extends Vote {
    userVotes: UserVote[],
    voteOptions: VoteOptions[]
}
