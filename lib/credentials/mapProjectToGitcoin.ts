import type { ConnectProjectDetails } from '../../@connect-shared/lib/projects/findProject';

const contributionTypes = {
  CONTRACT_ADDRESS: 'Contract address',
  GITHUB_REPO: 'Github repo',
  OTHER: 'Other'
} as const;

function generateContributionLinks(input: ConnectProjectDetails) {
  const links = [];

  if (input.github) {
    links.push({
      description: 'Github Repository',
      type: contributionTypes.GITHUB_REPO,
      url: input.github
    });
  }

  if (input.twitter) {
    links.push({
      description: 'Twitter Profile',
      type: contributionTypes.OTHER,
      url: input.twitter
    });
  }

  if (input.websites) {
    input.websites.forEach((url) => {
      links.push({
        description: 'Website',
        type: contributionTypes.OTHER,
        url
      });
    });
  }

  return links;
}

// TBD - Fields
export function mapProjectToGitcoin({
  project,
  agoraProjectRefUID
}: {
  project: ConnectProjectDetails;
  agoraProjectRefUID?: string;
}) {
  return {
    name: project.name || '', // Direct mapping
    bio: project.description || '', // Assuming bio comes from description
    websiteUrl: project.websites?.[0] || '', // Taking the first website URL
    contributionLinks: generateContributionLinks(project),
    sunnyAwards: {
      projectType: project.sunnyAwardsProjectType || '',
      category: project.sunnyAwardsCategory || '',
      categoryDetails: project.sunnyAwardsCategoryDetails || '',
      contracts:
        project.primaryContractChainId && project.primaryContractAddress
          ? [
              {
                chainId: project.primaryContractChainId,
                address: project.primaryContractAddress
              }
            ]
          : [],
      mintingWalletAddress: project.mintingWalletAddress || '',
      projectReferences: {
        charmverseId: project.id,
        agoraProjectRefUID: agoraProjectRefUID || ''
      },
      avatarUrl: project.avatar || '',
      coverImageUrl: project.coverImage || ''
    }
  };
}
