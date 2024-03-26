import { gql } from '@apollo/client';

export const getRoundApplicationsQuery = gql`
  query getRoundApplicationsQuery($first: Int = 1000, $skip: Int = 0, $status: Int = 1) {
    roundApplications(first: $first, skip: $skip, where: { status: $status }) {
      id
      status
      statusDescription
      applicationIndex
      statusSnapshots {
        status
        timestamp
      }
      round {
        id
        applicationsEndTime
        roundMetaPtr {
          pointer
        }
      }
      metaPtr {
        pointer
      }
    }
  }
`;
