import { User, UserVote, Vote } from '@prisma/client';
import { PageContent } from 'models';

export type VoteWithUsers = Vote & {
  description: PageContent
  options: {name: string, passThreshold: number}[]
  userVotes: (UserVote & {user: User})[]
}
