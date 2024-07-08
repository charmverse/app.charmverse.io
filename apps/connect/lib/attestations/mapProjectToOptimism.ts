import type { ConnectProjectDetails } from '../actions/fetchProject';

type Contract = {
  address: string;
  deploymentTxHash: string;
  deployerAddress: string;
  chainId: number; // Example chainIds: 10, 8453, 7777777
};

type VentureFunding = {
  amount: string; // Examples: "3m-5m", "1m-3m"
  year: string; // Example: "2023"
  details: string;
};

type Grant = {
  grant: string;
  link?: string | null;
  amount: string; // Examples: "under-250k", "1000000"
  date: string; // Example: "2023-03-01"
  details: string;
};

type Revenue = {
  amount: string; // Examples: "under-250k", "1m-3m", "500k-1m"
  details: string;
};

type OptimismProject = {
  name: string;
  description: string;
  projectAvatarUrl: string;
  projectCoverImageUrl: string;
  category: string;
  osoSlug?: string;
  socialLinks: {
    website?: string[];
    farcaster?: string[];
    twitter?: string; // Examples: "https://x.com/defillama", "@orderlynetwork"
    mirror?: string | null;
  };
  team: string[];
  github: string[];
  packages?: string[];
  contracts: Contract[];
  grantsAndFunding: {
    ventureFunding?: VentureFunding[];
    grants?: Grant[];
    revenue?: Revenue[];
  };
};
export function mapProjectToOptimism(input: ConnectProjectDetails): OptimismProject {
  return {
    name: input.name || '',
    description: input.description || '',
    projectAvatarUrl: input.avatar || '',
    projectCoverImageUrl: input.coverImage || '',
    category: input.category || '',
    socialLinks: {
      website: input.websites || [],
      farcaster: input.farcasterValues || [],
      twitter: input.twitter || '',
      mirror: input.mirror || null
    },
    team: input.projectMembers.map((member) => member.farcasterUser.displayName),
    github: input.github ? [input.github] : [],
    osoSlug: '', // Placeholder: requires specific input
    packages: [], // Placeholder: requires specific input
    contracts: [], // Placeholder: requires specific input
    grantsAndFunding: {
      ventureFunding: [], // Placeholder: requires specific input
      grants: [], // Placeholder: requires specific input
      revenue: [] // Placeholder: requires specific input
    }
  };
}
