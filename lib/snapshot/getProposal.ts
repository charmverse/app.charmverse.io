import { gql } from '@apollo/client';

import client, { createSnapshotGraphqlClient } from './graphql-client';
import type { SnapshotProposal } from './interfaces';

export async function getSnapshotProposal(proposalId: string, uri?: string): Promise<SnapshotProposal | null> {
  const snapShotClient = uri ? createSnapshotGraphqlClient(uri) : client;
  const { data } = await snapShotClient.query({
    query: gql`
      query Proposals {
        proposals(
          first: 1,
          skip: 0,
          where: {
            id: "${proposalId}"
          },
          orderBy: "created",
          orderDirection: desc
        ) {
          id
          title
          body
          choices
          start
          end
          snapshot
          state
          author
          space {
            id
            name
          }
          votes
          scores
          scores_total
          type
        }
      }
    `
  });

  return data.proposals[0] ?? null;
}
