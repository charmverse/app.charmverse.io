import { gql } from '@apollo/client';

import client from './graphql-client';
import type { SnapshotSpace } from './interfaces';

export async function getSnapshotSpace (spaceDomain: string): Promise<SnapshotSpace | null> {
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
        avatar
        terms
        
        filters {
          minScore
          onlyMembers
        }
        validation {
          name
        }
        plugins
        private
        __typename
        members
        categories
        validation {
          network
          params
        }
        about
      }
    }
  `
  });

  return data.space;
}
