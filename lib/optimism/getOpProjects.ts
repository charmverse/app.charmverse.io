import * as http from 'adapters/http';

export type OPProjectData = {
  avatarUrl: string;
  coverImageUrl: string;
  attestationUid: string;
  approvalAttestationUid: string;
  name: string;
  description: string;
  externalLink: string;
  socialLinks: {
    twitter: string;
    farcaster: string;
    mirror: string;
    website: string;
  };
  team: {
    farcasterId: string;
  }[];
  repositories: string[];
  deployedContracts: {
    address: string;
    chainId: string;
    deployer: string;
    creationBlock: string;
    transactionId: string;
    verificationProof: string;
    openSourceObserverSlug: string;
  }[];
  categories: {
    name: string;
    description: string;
  }[];
  funding: {
    ventureCapital: {
      amount: string;
      source: string;
      date: string;
      details: string;
    }[];
    grants: {
      amount: string;
      source: string;
      date: string;
      details: string;
    }[];
    optimismGrants: {
      amount: string;
      source: string;
      date: string;
      details: string;
      link: string;
      type: string;
    }[];
  };
};

type GetRoundProjectsResponse = {
  metadata: {
    hasNext: boolean;
    totalReturned: number;
    nextOffset: number;
  };
  projects: OPProjectData[];
};

const baseUrl = 'https://vote.optimism.io/api/v1/retrofunding/rounds/4/projects';
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.AGORA_API_KEY}`
};
const limit = 100;

export async function getOpProjects(): Promise<OPProjectData[]> {
  let response = await http.GET<GetRoundProjectsResponse>(baseUrl, { limit, offset: 0 }, { headers });
  const projects = response.projects;
  while (response.projects.length === limit) {
    response = await http.GET<GetRoundProjectsResponse>(
      baseUrl,
      { limit, offset: response.metadata.nextOffset },
      { headers }
    );
    projects.push(...response.projects);
  }
  return projects;
}
