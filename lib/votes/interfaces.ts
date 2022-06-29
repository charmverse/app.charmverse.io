import { Vote } from '@prisma/client';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;
export type VoteStatusType = typeof VOTE_STATUS[number];

export type VoteOptionsDTO = {
    name: string,
    threshold?: number
};

export type VoteDTO = Omit<Vote, 'id'|'status'|'createdAt'> & {
    options: VoteOptionsDTO[]
};

export type UpdateVoteDTO = {
    status: VoteStatusType
};
