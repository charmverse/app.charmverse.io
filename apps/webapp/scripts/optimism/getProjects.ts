import * as http from '@charmverse/core/http';

import { ProjectInputRow } from 'scripts/importOPGrantsProjects';

const baseUrl = 'https://vote.optimism.io/api/v1';

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

const getProjects = async () => {
  const data = await http.GET(`${baseUrl}`);
  console.log(data);
};

// export async function getProjects(): Promise<ProjectInputRow[]> {
//   console.log('🔥', 'Loading projects data from OP api...');
//   const opProjectsData = await getAllProjects();

//   const importInputData = opProjectsData.map((project) => {
//     const twitterHandle = getTwitterHandle(project.contributionLinks) || '';

//     return {
//       // title is used for projects imported out of CV propsoals
//       Title: '',
//       SpaceName: project.displayName,
//       username: '',
//       createdBy: '',
//       adminAddress: project.applicant.address.address,
//       'Project Twitter': twitterHandle ? `https://x.com/${twitterHandle}` : '',
//       status: '',
//       createdAt: '',
//       'Author Twitter': twitterHandle ? `https://x.com/${twitterHandle}` : '',
//       twitterUsername: twitterHandle,
//       avatarUrl: project.profile.profileImageUrl,
//       website: project.websiteUrl
//     };
//   });

//   console.log('🔥', `Loaded data for ${opProjectsData.length} projects`);

//   return importInputData;
// }
getProjects().catch(console.error);
