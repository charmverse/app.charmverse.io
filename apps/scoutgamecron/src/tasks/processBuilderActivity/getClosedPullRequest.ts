import { octokit } from './octokit';

type GetPrCloserResponse = {
  repository: {
    pullRequest: {
      title: string;
      state: 'CLOSED' | 'MERGED';
      timelineItems: {
        edges: {
          node: {
            actor: {
              login: string;
            };
            createdAt: string;
          };
        }[];
      };
    };
  };
};

const getPrCloser = `
  query ($owner: String!, $repo: String!, $prNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $prNumber) {
        title
        state
        timelineItems(first: 10, itemTypes: [CLOSED_EVENT]) {
          edges {
            node {
              ... on ClosedEvent {
                actor {
                  login
                }
                createdAt
              }
            }
          }
        }
      }
    }
  }
`;

export async function getClosedPullRequest({
  pullRequestNumber,
  repo
}: {
  pullRequestNumber: number;
  repo: { name: string; owner: string };
}) {
  const graphqlWithAuth = octokit.graphql.defaults({});
  const response = await graphqlWithAuth<GetPrCloserResponse>({
    query: getPrCloser,
    repo: repo.name,
    owner: repo.owner,
    prNumber: pullRequestNumber
  });
  const actor = response.repository.pullRequest.timelineItems.edges.map((edge) => edge.node)[0]?.actor;
  return { login: actor?.login || undefined };
}
