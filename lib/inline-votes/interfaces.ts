import { User, UserVote, Vote } from '@prisma/client';

export type VoteWithUsers = Vote & {
  description: string
  options: {name: string, passThreshold: number}[]
  userVotes: (UserVote & {user: User})[]
}
