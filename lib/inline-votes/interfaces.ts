import { User, UserVote, Vote } from '@prisma/client';

export type VoteWithUsers = Vote & {
  description: string
  threshold: number
  options: {name: string}[]
  userVotes: (UserVote & {user: User})[]
}
