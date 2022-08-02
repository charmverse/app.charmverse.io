import { Page, Proposal, Space, User, UserVote, Vote, VoteOptions, VoteStatus } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;
export type VoteStatusType = typeof VOTE_STATUS[number];

export interface VoteOptionsDTO {
    name: string,
    threshold?: number
}

export interface VoteDTO extends Omit<Vote, 'id'|'status'|'createdAt'> {
    voteOptions: string[]
}

export interface UpdateVoteDTO {
    status: VoteStatusType
}

export interface UserVoteDTO {
    choice: string,
}

export interface VoteCreationData extends Omit<VoteDTO, 'pageId'> {
  spaceId: string,
  pageId?: string,
  proposalId?: string
}

export interface ExtendedVote extends Vote {
    aggregatedResult: Record<string, number>
    voteOptions: VoteOptions[]
    userChoice: null | string
    totalVotes: number,
    proposal?: Proposal | null
}

export type VoteTaskWithPage = ExtendedVote & {
  page: Page
}

export type VoteTaskWithProposal = ExtendedVote & {
  proposal: Proposal & {
    page: Page
  }
}

export type VoteTask<P extends 'page' | 'proposal' = 'page'> = ExtendedVote & {
  space: Space
} & (P extends 'page' ? VoteTaskWithPage : VoteTaskWithProposal)

export type UserVoteExtendedDTO = UserVote & {
  user: Pick<User, 'avatar' | 'username'>
}

export interface SpaceVotesRequest {
  userId: string
  spaceId: string
}

export const voteStatusLabels: Record<VoteStatus, string> = {
  InProgress: 'In Progress',
  Cancelled: 'Cancelled',
  Passed: 'Passed',
  Rejected: 'Rejected'
};
