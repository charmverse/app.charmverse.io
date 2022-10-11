import { gql } from '@apollo/client';

import client from './graphql-client';

export type SnapshotVote = {
  id: string;
  voter: string;
  created: number;
  choice: 1;
  vp: number;
}

export async function getProposalVotes (proposalId: string): Promise<SnapshotVote[]> {
  const { data } = await client.query({
    query: gql`
    query Votes {
      votes(
        where: {
          proposal: "${proposalId}"
        },
        orderBy: "created",
        orderDirection: desc
      ) {
        id
        voter
        created
        choice
        vp
      }
    }    
  `
  });

  return data.votes;
}
