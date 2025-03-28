import type { Project } from '@charmverse/core/prisma-client';

export type Contract = {
  address: string;
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

export type OptimismProject = {
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

export type ProjectDetails = Pick<
  Project,
  | 'description'
  | 'avatar'
  | 'coverImage'
  | 'optimismCategory'
  | 'name'
  | 'farcasterValues'
  | 'github'
  | 'twitter'
  | 'websites'
  | 'primaryContractAddress'
  | 'primaryContractChainId'
  | 'mintingWalletAddress'
> & {
  projectMembers: {
    farcasterId: number;
  }[];
};

export function mapProjectToOptimism(input: ProjectDetails): OptimismProject {
  const mappedProject = {
    name: input.name || '',
    description: input.description || '',
    projectAvatarUrl: input.avatar || '',
    projectCoverImageUrl: input.coverImage || '',
    category: input.optimismCategory || '',
    socialLinks: {
      website: input.websites?.filter((v) => !!v) || [],
      farcaster: input.farcasterValues?.filter((v) => !!v) || [],
      twitter: input.twitter || '',
      mirror: null
    },
    team: input.projectMembers.map((member) => member.farcasterId?.toString()).filter(Boolean) as string[],
    github: (Array.isArray(input.github) ? input.github : [input.github].filter(Boolean)) as string[],
    osoSlug: '', // Placeholder: requires specific input
    packages: [], // Placeholder: requires specific input
    contracts: [], // Do not send contracts since we do not request all the required fields
    grantsAndFunding: {
      ventureFunding: [], // Placeholder: requires specific input
      grants: [], // Placeholder: requires specific input
      revenue: [] // Placeholder: requires specific input
    }
  };

  return mappedProject;
}
