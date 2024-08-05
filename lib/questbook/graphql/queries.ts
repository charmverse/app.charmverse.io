import { gql } from '@apollo/client';

export const getGrantApplicationsQuery = gql`
  query getGrantApplicationsQuery(
    $first: Int = 1000
    $skip: Int = 0
    $state: String = "approved"
    $startDate: Int = 1
  ) {
    grantApplications(
      where: { state: $state, actions_: { state: $state, updatedAtS_gte: $startDate } }
      first: $first
      skip: $skip
    ) {
      id
      applicantId
      state
      updatedAtS
      actions {
        id
        state
        updatedAtS
      }
      grant {
        id
        title
        link
      }
      fields {
        id
        values {
          id
          value
        }
      }
    }
  }
`;
