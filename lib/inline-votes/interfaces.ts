import { PageContent } from 'models/Page';

export interface VoteWithUsers {
  id: string
  title: string
  description?: PageContent
  deadline: Date
  options: {name: string, passThreshold: number}[]
  userVotes: {
    userId: string
    choice: string
    voteId: string
  }[]
}
