import { gql } from '@apollo/client';

import client from './graphql-client';
import type { SnapshotSpace } from './interfaces';

export async function getSnapshotSpace(spaceDomain: string): Promise<SnapshotSpace | null> {
  const { data } = await client.query({
    query: gql`
    query SingleSpace {
      space(id: "${spaceDomain}") {
        id
        name
        about
        network
        symbol
        strategies {
          name
          network
          params
        }
        admins
        members
        moderators
        avatar
        terms
        filters {
          minScore
          onlyMembers
        }
        plugins
        private
        __typename
        categories
        about
        voting {
          period
          delay
          type
        }
      }
    }
  `
  });

  return data.space;
}
