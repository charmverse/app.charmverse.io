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

export function mapProjectToGitcoin({ project }: { project: ConnectProjectDetails }) {
  return {
    name: project.name || '', // Direct mapping
    bio: project.description || '', // Assuming bio comes from description
    websiteUrl: project.websites?.[0] || '', // Taking the first website URL
    contributionDescription: project.description,
    contributionLinks: generateContributionLinks(project),
    // -------------- Missing fields
    impactCategory: [], // Assuming no direct mapping for categories
    impactDescription: '', // Placeholder: requires specific input
    payoutAddress: '', // Placeholder: needs specific logic or input
    impactMetrics: [], // Placeholder: requires specific input
    fundingSources: [] // Placeholder: requires specific input
  };
}
