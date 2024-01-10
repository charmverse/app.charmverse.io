import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { uniqBy } from 'lodash';

const client = new ApolloClient({ uri: 'https://vote.optimism.io/graphql', cache: new InMemoryCache({}) });

type ContributionLink = {
  type: string;
  url: string;
}

export type OPProjectData = {
  id: string;
  bio: string;
  displayName: string;
  profile: {
    profileImageUrl: string;
    bannerImageUrl: string;
  };
  websiteUrl: string;
  contributionLinks: ContributionLink[];
}

const getProjects = async (after: string) => {
    const { data } = await client.query({
      query: gql`
        query Round3Projects($after: String, $first: Int!, $orderBy: ProjectOrder!) {
          retroPGF {
            projects(after: $after, first: $first, orderBy: $orderBy) {
              edges {
                cursor
                node {
                  id,
                  bio
                  displayName
                  profile {
                    profileImageUrl
                    bannerImageUrl
                  }
                  contributionLinks {
                    type
                    url
                  }
                  websiteUrl
                }
              }
            }
            projectsAggregate {
              total
            }
          }
        }
      `,
      variables: {
        after: after || null,
        first: 100,
        orderBy: 'shuffle'
      }
    });

    return data.retroPGF;
};

const getAllProjects = async () => {
  let total = 0;
  let projects: any = [];

  while (!total || total > projects.length) {
    const lastProjectCursor = projects.length ? projects[projects.length - 1].cursor : '';
    const res = await getProjects(lastProjectCursor);

    const { projects: { edges }, projectsAggregate } = res;

    total = projectsAggregate.total;

    if (edges && !edges.length) {
      break;
    }

    const updatedProjects = uniqBy([...projects, ...edges], 'cursor');
    projects = updatedProjects;
  }

  const projectsData = projects.map((edge: any) => edge.node);

  return projectsData as OPProjectData[];
};

function getTwitterHandle(links: ContributionLink[]) {
  // find twitter.com or x.com  in url
  const link = links.find((link) => link.url.match(/twitter\.com|x\.com/));
  let handle = link?.url?.match(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/(#!\/)?([^\/]+)(\/\w+)*$/)?.[3]
  if (handle?.includes('?')) {
    handle = handle.split('?')[0];
  }

  return handle;
}