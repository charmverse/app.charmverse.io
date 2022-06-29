import { Vote } from '@prisma/client';

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;
export type VoteStatusType = typeof VOTE_STATUS[number];

export type VoteModel = Omit<Vote, 'id'|'status'|'createdAt'>;
