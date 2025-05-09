import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { uniqBy } from 'lodash';
import { ProjectInputRow } from 'scripts/importOPGrantsProjects';

const client = new ApolloClient({ uri: 'https://vote.optimism.io/graphql', cache: new InMemoryCache({}) });

type ContributionLink = {
  type: string;
  url: string;
};

export type OPProjectData = {
  id: string;
  bio: string;
  displayName: string;
  profile: {
    profileImageUrl: string;
    bannerImageUrl: string;
  };
  applicant: {
    address: {
      address: string;
    };
  };
  websiteUrl: string;
  contributionLinks: ContributionLink[];
};

const getProjects = async (after: string) => {
  const { data } = await client.query({
    query: gql`
      query Retro3PGF($after: String, $first: Int!, $orderBy: ProjectOrder!) {
        retroPGF {
          projects(after: $after, first: $first, orderBy: $orderBy) {
            edges {
              cursor
              node {
                id
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
                applicant {
                  address {
                    address
                    isContract
                  }
                }
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

    const {
      projects: { edges },
      projectsAggregate
    } = res;

    total = projectsAggregate.total;

    if (edges && !edges.length) {
      break;
    }

    const updatedProjects = uniqBy([...projects, ...edges], 'cursor');
    projects = updatedProjects;
    console.log('🔥 partial loaded:', projects.length);
  }

  const projectsData = projects.map((edge: any) => edge.node);

  return projectsData as OPProjectData[];
};

function getTwitterHandle(links: ContributionLink[]) {
  // find x.com or x.com  in url
  const link = links.find((link) => link.url.match(/twitter\.com|x\.com/));
  let handle = link?.url?.match(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/(#!\/)?([^\/]+)(\/\w+)*$/)?.[3];
  if (handle?.includes('?')) {
    handle = handle.split('?')[0];
  }

  return handle;
}

export async function getProjectsImportData(): Promise<ProjectInputRow[]> {
  console.log('🔥', 'Loading projects data from OP api...');
  const opProjectsData = await getAllProjects();

  const importInputData = opProjectsData.map((project) => {
    const twitterHandle = getTwitterHandle(project.contributionLinks) || '';

    return {
      // title is used for projects imported out of CV propsoals
      Title: '',
      SpaceName: project.displayName,
      username: '',
      createdBy: '',
      adminAddress: project.applicant.address.address,
      'Project Twitter': twitterHandle ? `https://x.com/${twitterHandle}` : '',
      status: '',
      createdAt: '',
      'Author Twitter': twitterHandle ? `https://x.com/${twitterHandle}` : '',
      twitterUsername: twitterHandle,
      avatarUrl: project.profile.profileImageUrl,
      website: project.websiteUrl
    };
  });

  console.log('🔥', `Loaded data for ${opProjectsData.length} projects`);

  return importInputData;
}
