import { PageContent } from 'models/Page';

export interface VoteWithUsers {
  id: string
  title: string
  description: PageContent
  deadline: Date
  type: 'boolean' | 'options'
  options?: string[]
  votes: {
    userId: string
    votedOptionId: string
  }[]
}
